# Phase 2: Core Booking Logic Specification
# Booking SaaS — Barbershop Appointment Platform

> This spec covers the most critical feature in the MVP: the booking system.
> The availability/conflict checking logic is the foundation of the entire product.
> Follow every detail. One error here breaks everything.

---

## Overview

### What We're Building

The core booking system consists of:

1. **AvailabilityService** — Generates available time slots for booking
2. **AvailabilityRepository** — Queries for conflict detection (DB-level)
3. **CreateBookingAction** — Creates a booking with full validation
4. **AssignAvailableStaffAction** — Finds the first free staff member
5. **CancelBookingAction** — Cancels a booking
6. **MarkBookingCompletedAction** — Marks booking as completed, increments customer visit count
7. **MarkBookingNoShowAction** — Marks booking as no-show, does NOT increment visit count
8. **Events & Listeners** — Trigger WhatsApp confirmation on booking creation
9. **Tests** — Feature and unit tests for all critical paths

### Why This Matters

Barbershop bookings are **perishable resources** — an empty time slot can never be resold.
The #1 requirement is: **zero double-bookings**.

All booking logic must:
- Run inside a DB transaction with row-level locking.
- Re-check availability immediately before insertion (not just in the frontend).
- Use a composite index on `(staff_id, starts_at, ends_at)` for fast conflict queries.
- Handle race conditions (two customers booking the same slot simultaneously).

---

## Critical Concepts

### Time Handling

**Database Storage:**
- All `timestamp` columns stored in **UTC**.
- MySQL uses `DATETIME` type (no timezone info) — just store UTC time.
- Laravel's `Carbon` handles conversion.

**Business Logic:**
- Business is in `Africa/Cairo` timezone (UTC+3, no DST).
- All time calculations use `now('Africa/Cairo')`.
- When querying for "today's appointments," query using Cairo time, not UTC.

**Example:**
```php
// Store in UTC
$startsAt = now('Africa/Cairo')->setHour(14)->setMinute(0);
$startsAt_utc = $startsAt->setTimezone('UTC');  // internal conversion
// DB stores: 2026-06-24 11:00:00 (UTC)

// Retrieve and display
$booking->starts_at;  // Laravel returns as UTC time
$booking->starts_at->setTimezone('Africa/Cairo');  // display as Cairo time: 2:00 PM
```

### Slot Generation

A "slot" is a 30-minute window (for a haircut service).

**Example: Generate slots for Monday, June 24, 2026**

Branch working hours: 9 AM – 6 PM Cairo time
Service duration: 30 minutes
Staff: Ahmed

Possible slots:
- 9:00 AM – 9:30 AM
- 9:30 AM – 10:00 AM
- 10:00 AM – 10:30 AM
- ... (every 30 minutes)
- 5:30 PM – 6:00 PM

If Ahmed has a confirmed booking 10:00 AM – 10:30 AM, those slots are removed:
- 10:00 AM – 10:30 AM (conflicts — Ahmed is booked)
- 9:30 AM – 10:00 AM (conflicts — overlaps with Ahmed's booking)

Only non-overlapping slots are returned.

### Conflict Detection

A booking conflicts if:
```
staff_id is the same AND
status is 'confirmed' AND
new_starts_at < existing_ends_at AND
new_ends_at > existing_starts_at
```

This is the standard interval overlap check (Allen's interval algebra).

**Example:**
```
Existing booking: 10:00 AM – 10:30 AM
New booking attempt: 10:15 AM – 10:45 AM
Conflict? YES (10:15 < 10:30 AND 10:45 > 10:00)

New booking attempt: 10:30 AM – 11:00 AM
Conflict? NO (10:30 is not < 10:30)

New booking attempt: 9:30 AM – 10:00 AM
Conflict? NO (10:00 is not > 10:00)
```

### "Any Available" Logic

When a customer books without specifying a staff member, the system picks the first
available staff member who:
1. Can perform the requested service (has entry in `staff_services` pivot)
2. Is not booked during the requested time slot
3. Works during that time (per `staff_working_hours`)

**Order of assignment:** Staff IDs in ascending order (arbitrary but deterministic).

---

## 1. AvailabilityService

### File Path

`backend/app/Services/AvailabilityService.php`

### Responsibilities

1. Generate available time slots for a branch/service/staff/date combination.
2. Check if a specific time slot is available (conflict detection).
3. Throw exceptions with clear messages on availability issues.

### Imports & Dependencies

```php
use App\Models\Branch;
use App\Models\Service;
use App\Models\Staff;
use App\Repositories\AvailabilityRepository;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
```

### Method 1: `getAvailableSlots()`

**Signature:**
```php
public function getAvailableSlots(
    Branch $branch,
    Service $service,
    ?Staff $staff = null,
    Carbon $date,
): SupportCollection
```

**Parameters:**
- `$branch` — Branch where the booking happens (has working hours)
- `$service` — Service being booked (has duration_minutes)
- `$staff` — Specific staff member OR null (means "any available")
- `$date` — Date for which to generate slots (just the date part, time ignored)

**Returns:**
- `SupportCollection` of slot objects, each containing:
  ```php
  [
      'id' => 'ahmed_10_00',  // unique slot ID
      'starts_at' => Carbon,  // in Cairo timezone
      'ends_at' => Carbon,    // in Cairo timezone
      'staff_id' => 'uuid',   // assigned staff ID
      'staff_name' => 'Ahmed', // assigned staff name
  ]
  ```

**Algorithm:**

```
1. Get branch working hours for the given date's weekday
   - If closed that day, return empty collection
2. If staff is specified:
   a. Get that staff's working hours for the weekday
   b. Intersect with branch hours
   c. Get all confirmed bookings for that staff on that date
   d. Generate 30-min slots between the intersected hours
   e. Remove any slots that overlap with existing bookings
   f. Return slots
3. If staff is null (any available):
   a. For each staff member who can perform this service:
      - Get their available slots (repeat step 2)
      - Pick the first available staff member (lowest ID)
      - Generate slots for that staff only
   b. If no staff available, try next staff
   c. Return slots for the first available staff, or empty if all booked
```

**Code Structure:**

```php
public function getAvailableSlots(
    Branch $branch,
    Service $service,
    ?Staff $staff = null,
    Carbon $date,
): SupportCollection {
    // Normalize date to start of day (Cairo time)
    $date = $date->clone()->setTimezone('Africa/Cairo')->startOfDay();

    // Get working hours for this weekday (0 = Sunday, 5 = Friday, 6 = Saturday)
    $weekday = $date->dayOfWeek;
    $branchHours = $branch->workingHours()->where('weekday', $weekday)->first();

    if (! $branchHours || ! $branchHours->open_time) {
        // Branch is closed this day
        return collect([]);
    }

    if ($staff) {
        // Specific staff requested
        return $this->getSlotsForSpecificStaff($branch, $service, $staff, $date);
    }

    // Any available — find first free staff for this service
    return $this->getSlotsForAnyAvailableStaff($branch, $service, $date);
}

private function getSlotsForSpecificStaff(
    Branch $branch,
    Service $service,
    Staff $staff,
    Carbon $date,
): SupportCollection {
    $weekday = $date->dayOfWeek;

    // Check staff can perform this service
    if (! $staff->services()->where('service_id', $service->id)->exists()) {
        return collect([]); // Staff doesn't offer this service
    }

    // Get staff working hours for this weekday
    $staffHours = $staff->workingHours()->where('weekday', $weekday)->first();
    if (! $staffHours || ! $staffHours->start_time) {
        return collect([]); // Staff doesn't work this day
    }

    // Get branch working hours for this weekday
    $branchHours = $branch->workingHours()->where('weekday', $weekday)->first();
    if (! $branchHours || ! $branchHours->open_time) {
        return collect([]); // Branch is closed
    }

    // Intersect staff hours with branch hours
    $openTime = max(
        strtotime($branchHours->open_time),
        strtotime($staffHours->start_time)
    );
    $closeTime = min(
        strtotime($branchHours->close_time),
        strtotime($staffHours->end_time)
    );

    if ($openTime >= $closeTime) {
        return collect([]); // No overlap
    }

    // Convert back to Carbon times
    $startOfDay = $date->clone()->setHour(0)->setMinute(0);
    $openDateTime = $startOfDay->clone()->addSeconds($openTime - strtotime($startOfDay->toDateString()));
    $closeDateTime = $startOfDay->clone()->addSeconds($closeTime - strtotime($startOfDay->toDateString()));

    // Get all confirmed bookings for this staff on this date
    $bookedSlots = $this->repository->getConfirmedBookingsForStaffOnDate(
        $staff->id,
        $date,
    );

    // Generate slots
    $duration = $service->duration_minutes;
    $slots = collect([]);

    $current = $openDateTime->clone();
    while ($current->clone()->addMinutes($duration) <= $closeDateTime) {
        $slotEnd = $current->clone()->addMinutes($duration);

        // Check if this slot conflicts with any booking
        $isAvailable = ! $bookedSlots->contains(function ($booking) use ($current, $slotEnd) {
            return $current < $booking->ends_at && $slotEnd > $booking->starts_at;
        });

        if ($isAvailable) {
            $slots->push([
                'id' => $staff->id . '_' . $current->format('H_i'),
                'starts_at' => $current->clone(),
                'ends_at' => $slotEnd->clone(),
                'staff_id' => $staff->id,
                'staff_name' => $staff->name,
            ]);
        }

        $current->addMinutes($duration);
    }

    return $slots;
}

private function getSlotsForAnyAvailableStaff(
    Branch $branch,
    Service $service,
    Carbon $date,
): SupportCollection {
    // Find all staff who can perform this service, ordered by ID
    $qualifiedStaff = $service->staff()
        ->where('branch_id', $branch->id)
        ->orderBy('id')
        ->get();

    // Try each staff member until we find one with availability
    foreach ($qualifiedStaff as $staff) {
        $slots = $this->getSlotsForSpecificStaff($branch, $service, $staff, $date);
        if ($slots->isNotEmpty()) {
            return $slots;
        }
    }

    // No staff available
    return collect([]);
}
```

### Method 2: `assertSlotAvailable()`

**Signature:**
```php
public function assertSlotAvailable(
    string $staffId,
    Carbon $startsAt,
    Carbon $endsAt,
): void
```

**Purpose:**
Re-check that a slot is still available immediately before booking.
This is called inside the `CreateBookingAction` within a DB transaction.

**Behavior:**
- Throws `SlotNotAvailableException` if conflict detected.
- Uses the composite index on `(staff_id, starts_at, ends_at)` for fast query.
- Ignores cancelled/no-show bookings (only checks `status = 'confirmed'`).

**Code:**
```php
public function assertSlotAvailable(
    string $staffId,
    Carbon $startsAt,
    Carbon $endsAt,
): void {
    $conflict = $this->repository->findConflictingBooking(
        $staffId,
        $startsAt,
        $endsAt,
    );

    if ($conflict) {
        throw new SlotNotAvailableException(
            'This time slot is no longer available. Please choose a different time.',
        );
    }
}
```

---

## 2. AvailabilityRepository

### File Path

`backend/app/Repositories/AvailabilityRepository.php`

### Purpose

Raw query methods for conflict detection.
These are separated from the service to keep queries explicit and testable.

### Method 1: `getConfirmedBookingsForStaffOnDate()`

**Signature:**
```php
public function getConfirmedBookingsForStaffOnDate(
    string $staffId,
    Carbon $date,
): Collection
```

**Query:**
```sql
SELECT id, starts_at, ends_at
FROM bookings
WHERE staff_id = ?
  AND status = 'confirmed'
  AND DATE(starts_at) = ?
ORDER BY starts_at ASC
```

**Note:** `DATE(starts_at)` extracts the date part in MySQL. Works even though times are stored in UTC, as long as you handle the timezone conversion in the service layer (which we do).

**Code:**
```php
public function getConfirmedBookingsForStaffOnDate(
    string $staffId,
    Carbon $date,
): Collection {
    return Booking::where('staff_id', $staffId)
        ->where('status', BookingStatus::Confirmed)
        ->whereDate('starts_at', $date->toDateString())
        ->orderBy('starts_at')
        ->get(['id', 'starts_at', 'ends_at']);
}
```

### Method 2: `findConflictingBooking()`

**Signature:**
```php
public function findConflictingBooking(
    string $staffId,
    Carbon $startsAt,
    Carbon $endsAt,
): ?Booking
```

**Query (uses the composite index):**
```sql
SELECT id
FROM bookings
WHERE staff_id = ?
  AND status = 'confirmed'
  AND starts_at < ?  -- existing.starts_at < new.ends_at
  AND ends_at > ?    -- existing.ends_at > new.starts_at
LIMIT 1
```

**Index:** This query MUST use the composite index `(staff_id, starts_at, ends_at)`.

**Code:**
```php
public function findConflictingBooking(
    string $staffId,
    Carbon $startsAt,
    Carbon $endsAt,
): ?Booking {
    return Booking::where('staff_id', $staffId)
        ->where('status', BookingStatus::Confirmed)
        ->where('starts_at', '<', $endsAt)
        ->where('ends_at', '>', $startsAt)
        ->first();
}
```

---

## 3. CreateBookingAction

### File Path

`backend/app/Actions/Bookings/CreateBookingAction.php`

### Responsibility

Create a booking with full validation and transaction safety.

### High-Level Flow

```
Input: CreateBookingData (branch_id, service_id, staff_id or null, customer_id, starts_at, ends_at)
  ↓
Validate inputs (IDs exist, times make sense)
  ↓
Start DB transaction
  ↓
Re-check availability (inside transaction with row lock)
  ↓
If "any available" and staff_id is null:
  Assign first free staff
  ↓
Create booking record
  ↓
Fire BookingCreated event
  ↓
Commit transaction
  ↓
Return booking
```

### Input Data Class

First, create a data transfer object:

```php
// backend/app/Data/CreateBookingData.php

<?php

declare(strict_types=1);

namespace App\Data;

use Carbon\Carbon;

class CreateBookingData
{
    public function __construct(
        public readonly string $businessId,
        public readonly string $branchId,
        public readonly string $serviceId,
        public readonly string $customerId,
        public readonly Carbon $startsAt,
        public readonly Carbon $endsAt,
        public readonly ?string $staffId = null,
        public readonly string $source = 'online', // 'online' or 'manual'
        public readonly ?string $notes = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            businessId: auth()->user()->business_id,
            branchId: $request->validated('branch_id'),
            serviceId: $request->validated('service_id'),
            customerId: $request->validated('customer_id'),
            startsAt: Carbon::parse($request->validated('starts_at'))->setTimezone('Africa/Cairo'),
            endsAt: Carbon::parse($request->validated('ends_at'))->setTimezone('Africa/Cairo'),
            staffId: $request->validated('staff_id'),
            source: $request->validated('source', 'online'),
            notes: $request->validated('notes'),
        );
    }
}
```

### Action Code

```php
<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Data\CreateBookingData;
use App\Enums\BookingStatus;
use App\Enums\BookingSource;
use App\Events\BookingCreated;
use App\Exceptions\SlotNotAvailableException;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Service;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

final class CreateBookingAction
{
    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly AssignAvailableStaffAction $assignStaff,
    ) {}

    /**
     * Create a booking with full validation and conflict checking.
     *
     * @throws SlotNotAvailableException if slot is taken
     * @throws \InvalidArgumentException if input data is invalid
     */
    public function handle(CreateBookingData $data): Booking
    {
        return DB::transaction(function () use ($data) {
            // Validate foreign keys exist
            $branch = Branch::findOrFail($data->branchId);
            $service = Service::findOrFail($data->serviceId);
            $customer = Customer::findOrFail($data->customerId);

            // Validate times
            if ($data->startsAt->greaterThanOrEqualTo($data->endsAt)) {
                throw new \InvalidArgumentException('Start time must be before end time.');
            }

            if ($data->startsAt->lessThanOrEqualTo(now('Africa/Cairo'))) {
                throw new \InvalidArgumentException('Cannot book in the past.');
            }

            // Determine which staff will be assigned
            $staffId = $data->staffId;
            if (! $staffId) {
                // "Any available" — find the first free staff
                $staffId = $this->assignStaff->handle(
                    $branch,
                    $service,
                    $data->startsAt,
                    $data->endsAt,
                )?->id;

                if (! $staffId) {
                    throw new SlotNotAvailableException(
                        'No staff available for this service at the requested time.',
                    );
                }
            }

            // Re-check availability inside transaction (critical for race condition prevention)
            $this->availability->assertSlotAvailable(
                $staffId,
                $data->startsAt,
                $data->endsAt,
            );

            // Create the booking
            $booking = Booking::create([
                'business_id' => $data->businessId,
                'branch_id' => $data->branchId,
                'customer_id' => $data->customerId,
                'service_id' => $data->serviceId,
                'staff_id' => $staffId,
                'starts_at' => $data->startsAt->setTimezone('UTC'),
                'ends_at' => $data->endsAt->setTimezone('UTC'),
                'status' => BookingStatus::Confirmed,
                'source' => BookingSource::from($data->source),
                'notes' => $data->notes,
                'created_by_user_id' => auth()?->id(),
            ]);

            // Fire the event (n8n will pick this up for WhatsApp confirmation)
            event(new BookingCreated($booking));

            return $booking;
        });
    }
}
```

---

## 4. AssignAvailableStaffAction

### File Path

`backend/app/Actions/Bookings/AssignAvailableStaffAction.php`

### Responsibility

Find the first staff member available for a given service + time slot.

### Code

```php
<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Models\Branch;
use App\Models\Service;
use App\Models\Staff;
use App\Repositories\AvailabilityRepository;
use Carbon\Carbon;

final class AssignAvailableStaffAction
{
    public function __construct(
        private readonly AvailabilityRepository $repository,
    ) {}

    /**
     * Find the first available staff member who can perform the service at the given time.
     *
     * @return Staff|null Staff member if available, null if none available
     */
    public function handle(
        Branch $branch,
        Service $service,
        Carbon $startsAt,
        Carbon $endsAt,
    ): ?Staff {
        // Find all staff who can perform this service, ordered by ID
        $qualifiedStaff = $service->staff()
            ->where('branch_id', $branch->id)
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        foreach ($qualifiedStaff as $staff) {
            // Check if this staff member has a conflict
            $conflict = $this->repository->findConflictingBooking(
                $staff->id,
                $startsAt,
                $endsAt,
            );

            if (! $conflict) {
                // This staff is available
                return $staff;
            }
        }

        // No staff available
        return null;
    }
}
```

---

## 5. CancelBookingAction

### File Path

`backend/app/Actions/Bookings/CancelBookingAction.php`

### Responsibility

Cancel a booking and fire a cancellation event (for WhatsApp notification in Phase 2).

### Code

```php
<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Events\BookingCancelled;
use App\Models\Booking;
use Illuminate\Database\Eloquent\ModelNotFoundException;

final class CancelBookingAction
{
    /**
     * Cancel a booking by ID.
     *
     * @throws ModelNotFoundException if booking not found
     * @throws \InvalidArgumentException if booking is already completed/cancelled
     */
    public function handle(string $bookingId): Booking
    {
        $booking = Booking::findOrFail($bookingId);

        // Can't cancel if already completed or cancelled
        if (in_array($booking->status, [BookingStatus::Completed, BookingStatus::Cancelled], true)) {
            throw new \InvalidArgumentException(
                'Cannot cancel a booking that is already completed or cancelled.',
            );
        }

        // Update status
        $booking->update(['status' => BookingStatus::Cancelled]);

        // Fire event for notifications (Phase 2)
        event(new BookingCancelled($booking));

        return $booking;
    }
}
```

---

## 6. MarkBookingCompletedAction

### File Path

`backend/app/Actions/Bookings/MarkBookingCompletedAction.php`

### Responsibility

Mark a booking as completed and increment the customer's visit count.

### Code

```php
<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

final class MarkBookingCompletedAction
{
    /**
     * Mark a booking as completed.
     * Increments customer.visit_count and sets customer.last_visit_at.
     *
     * @throws ModelNotFoundException if booking not found
     */
    public function handle(string $bookingId): Booking
    {
        return DB::transaction(function () use ($bookingId) {
            $booking = Booking::lockForUpdate()->findOrFail($bookingId);

            // Can't complete if not confirmed
            if ($booking->status !== BookingStatus::Confirmed) {
                throw new \InvalidArgumentException(
                    'Only confirmed bookings can be marked as completed.',
                );
            }

            // Mark as completed
            $booking->update(['status' => BookingStatus::Completed]);

            // Increment customer visit count and update last visit
            $booking->customer->increment('visit_count');
            $booking->customer->update([
                'last_visit_at' => now('Africa/Cairo'),
            ]);

            return $booking;
        });
    }
}
```

---

## 7. MarkBookingNoShowAction

### File Path

`backend/app/Actions/Bookings/MarkBookingNoShowAction.php`

### Important Note

**A no-show does NOT increment the customer's visit count.**
Only completed bookings increment visit count.
This distinction is intentional — visit count measures actual successful visits.

### Code

```php
<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

final class MarkBookingNoShowAction
{
    /**
     * Mark a booking as no-show.
     * Does NOT increment customer visit count (only completed bookings do).
     *
     * @throws ModelNotFoundException if booking not found
     */
    public function handle(string $bookingId): Booking
    {
        return DB::transaction(function () use ($bookingId) {
            $booking = Booking::lockForUpdate()->findOrFail($bookingId);

            // Can't mark as no-show if not confirmed
            if ($booking->status !== BookingStatus::Confirmed) {
                throw new \InvalidArgumentException(
                    'Only confirmed bookings can be marked as no-show.',
                );
            }

            // Mark as no-show
            $booking->update(['status' => BookingStatus::NoShow]);

            // Do NOT increment visit count — no-shows are not visits

            return $booking;
        });
    }
}
```

---

## 8. Events & Listeners

### Event 1: BookingCreated

**File:** `backend/app/Events/BookingCreated.php`

```php
<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Booking $booking) {}
}
```

### Listener: DispatchBookingConfirmationJob

**File:** `backend/app/Listeners/DispatchBookingConfirmationJob.php`

```php
<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Jobs\SendBookingConfirmationWebhook;

final class DispatchBookingConfirmationJob
{
    /**
     * Fire a job to send WhatsApp confirmation via n8n webhook.
     */
    public function handle(BookingCreated $event): void
    {
        dispatch(new SendBookingConfirmationWebhook($event->booking))
            ->onQueue('notifications');
    }
}
```

### Register in EventServiceProvider

**File:** `backend/app/Providers/EventServiceProvider.php`

```php
protected $listen = [
    BookingCreated::class => [
        DispatchBookingConfirmationJob::class,
    ],
    BookingCompleted::class => [
        UpdateCustomerVisitStats::class,
    ],
];
```

### Event 2: BookingCancelled (Phase 2)

```php
// backend/app/Events/BookingCancelled.php
class BookingCancelled
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
    public function __construct(public readonly Booking $booking) {}
}
```

---

## 9. Tests

### Test File 1: AvailabilityConflictTest (Feature)

**File:** `backend/tests/Feature/Booking/AvailabilityConflictTest.php`

**Purpose:** Verify that double-booking is impossible.

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Data\CreateBookingData;
use App\Enums\BookingStatus;
use App\Exceptions\SlotNotAvailableException;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailabilityConflictTest extends TestCase
{
    use RefreshDatabase;

    protected Business $business;
    protected Branch $branch;
    protected Staff $staff;
    protected Service $service;
    protected Customer $customer1;
    protected Customer $customer2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create demo business with one branch, one staff, one service
        $this->business = Business::factory()->create();
        $this->branch = Branch::factory()->for($this->business)->create();
        $this->staff = Staff::factory()->for($this->business)->for($this->branch)->create();
        $this->service = Service::factory()->for($this->business)->for($this->branch)->create([
            'duration_minutes' => 30,
        ]);

        // Link staff to service
        $this->staff->services()->attach($this->service->id);

        // Create customers
        $this->customer1 = Customer::factory()->for($this->business)->create();
        $this->customer2 = Customer::factory()->for($this->business)->create();
    }

    /**
     * Test that a second booking cannot be created for the same staff at the same time.
     */
    public function test_double_booking_is_rejected(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Create first booking
        $booking1 = Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer1->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
        ]);

        // Attempt second booking at exact same time
        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );

        // Should throw conflict exception
        $this->expectException(SlotNotAvailableException::class);

        $this->app->make(CreateBookingAction::class)->handle($data);
    }

    /**
     * Test that overlapping bookings are rejected.
     */
    public function test_overlapping_booking_is_rejected(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Create first booking: 2:00 PM – 2:30 PM
        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer1->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
        ]);

        // Attempt booking at 2:15 PM – 2:45 PM (overlaps)
        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt->clone()->addMinutes(15),
            endsAt: $endsAt->clone()->addMinutes(15),
            staffId: $this->staff->id,
        );

        $this->expectException(SlotNotAvailableException::class);
        $this->app->make(CreateBookingAction::class)->handle($data);
    }

    /**
     * Test that back-to-back bookings are allowed.
     */
    public function test_back_to_back_booking_is_allowed(): void
    {
        $startsAt1 = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt1 = $startsAt1->clone()->addMinutes(30);

        // Create first booking: 2:00 PM – 2:30 PM
        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer1->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt1->setTimezone('UTC'),
            'ends_at' => $endsAt1->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
        ]);

        // Create second booking at exactly 2:30 PM (no gap)
        $startsAt2 = $endsAt1->clone();
        $endsAt2 = $startsAt2->clone()->addMinutes(30);

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt2,
            endsAt: $endsAt2,
            staffId: $this->staff->id,
        );

        // Should succeed
        $booking2 = $this->app->make(CreateBookingAction::class)->handle($data);
        $this->assertTrue($booking2->exists);
    }

    /**
     * Test that cancelled bookings don't block slots.
     */
    public function test_cancelled_booking_does_not_block_slot(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Create a booking and then cancel it
        $booking1 = Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer1->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
        ]);

        $booking1->update(['status' => BookingStatus::Cancelled]);

        // Now another customer can book the same slot
        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );

        $booking2 = $this->app->make(CreateBookingAction::class)->handle($data);
        $this->assertTrue($booking2->exists);
    }
}
```

### Test File 2: AnyAvailableStaffAssignmentTest (Feature)

**File:** `backend/tests/Feature/Booking/AnyAvailableStaffAssignmentTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Data\CreateBookingData;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnyAvailableStaffAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected Business $business;
    protected Branch $branch;
    protected Staff $staff1;
    protected Staff $staff2;
    protected Service $service;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->business = Business::factory()->create();
        $this->branch = Branch::factory()->for($this->business)->create();

        // Create two staff members
        $this->staff1 = Staff::factory()->for($this->business)->for($this->branch)->create(['name' => 'Ahmed']);
        $this->staff2 = Staff::factory()->for($this->business)->for($this->branch)->create(['name' => 'Karim']);

        // Create service
        $this->service = Service::factory()->for($this->business)->for($this->branch)->create([
            'duration_minutes' => 30,
        ]);

        // Both staff can perform the service
        $this->staff1->services()->attach($this->service->id);
        $this->staff2->services()->attach($this->service->id);

        // Create customer
        $this->customer = Customer::factory()->for($this->business)->create();
    }

    /**
     * Test that "any available" assigns the first available staff.
     */
    public function test_any_available_assigns_first_staff(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: null, // Any available
        );

        $booking = $this->app->make(CreateBookingAction::class)->handle($data);

        // Should be assigned to staff1 (lower ID, assuming IDs are sequential)
        $this->assertTrue($booking->staff_id === $this->staff1->id);
    }

    /**
     * Test that "any available" assigns next staff if first is booked.
     */
    public function test_any_available_assigns_next_staff_if_first_booked(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Book staff1 at the requested time
        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff1->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
        ]);

        // Now book with "any available"
        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: null, // Any available
        );

        $booking = $this->app->make(CreateBookingAction::class)->handle($data);

        // Should be assigned to staff2 (staff1 is booked)
        $this->assertTrue($booking->staff_id === $this->staff2->id);
    }

    /**
     * Test that "any available" throws if all staff are booked.
     */
    public function test_any_available_throws_if_all_staff_booked(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Book both staff at the same time
        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff1->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
        ]);

        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff2->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
        ]);

        // Try to book "any available"
        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: null, // Any available
        );

        $this->expectException(\Exception::class); // SlotNotAvailableException or similar
        $this->app->make(CreateBookingAction::class)->handle($data);
    }
}
```

### Test File 3: AvailabilityServiceTest (Unit)

**File:** `backend/tests/Unit/AvailabilityServiceTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Branch;
use App\Models\BranchWorkingHour;
use App\Models\Business;
use App\Models\Service;
use App\Models\Staff;
use App\Models\StaffWorkingHour;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailabilityServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AvailabilityService $availability;
    protected Business $business;
    protected Branch $branch;
    protected Staff $staff;
    protected Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->availability = app(AvailabilityService::class);

        // Create demo setup
        $this->business = Business::factory()->create();
        $this->branch = Branch::factory()->for($this->business)->create();
        $this->staff = Staff::factory()->for($this->business)->for($this->branch)->create();
        $this->service = Service::factory()->for($this->business)->for($this->branch)->create([
            'duration_minutes' => 30,
        ]);

        $this->staff->services()->attach($this->service->id);
    }

    /**
     * Test that slots are generated for available times.
     */
    public function test_generates_slots_for_working_hours(): void
    {
        // Set up working hours: 9 AM – 6 PM, Monday (1)
        $this->setupWorkingHours(1, '09:00', '18:00');

        // Pick a Monday
        $monday = now('Africa/Cairo')->nextMonday();

        $slots = $this->availability->getAvailableSlots(
            $this->branch,
            $this->service,
            $this->staff,
            $monday,
        );

        // 9 AM to 6 PM with 30-min slots = 18 slots
        $this->assertCount(18, $slots);

        // First slot should be 9:00 AM
        $this->assertEquals(9, $slots->first()['starts_at']->hour);
        $this->assertEquals(0, $slots->first()['starts_at']->minute);
    }

    /**
     * Test that no slots are returned for closed days.
     */
    public function test_no_slots_for_closed_days(): void
    {
        // Set up: closed on Friday (5)
        $this->setupWorkingHours(5, null, null);

        $friday = now('Africa/Cairo')->nextFriday();

        $slots = $this->availability->getAvailableSlots(
            $this->branch,
            $this->service,
            $this->staff,
            $friday,
        );

        $this->assertCount(0, $slots);
    }

    protected function setupWorkingHours(int $weekday, ?string $open, ?string $close): void
    {
        BranchWorkingHour::create([
            'branch_id' => $this->branch->id,
            'weekday' => $weekday,
            'open_time' => $open,
            'close_time' => $close,
        ]);

        StaffWorkingHour::create([
            'staff_id' => $this->staff->id,
            'weekday' => $weekday,
            'start_time' => $open,
            'end_time' => $close,
        ]);
    }
}
```

---

## Exceptions

### Create Exception Class

**File:** `backend/app/Exceptions/SlotNotAvailableException.php`

```php
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

class SlotNotAvailableException extends Exception
{
    public function render()
    {
        return response()->json([
            'message' => $this->message ?? 'The requested time slot is not available.',
        ], 422);
    }
}
```

---

## Implementation Checklist

Before moving to feature development, verify all these items:

### Code Files Created
- [ ] `AvailabilityService` in `app/Services/`
- [ ] `AvailabilityRepository` in `app/Repositories/`
- [ ] `CreateBookingAction` in `app/Actions/Bookings/`
- [ ] `AssignAvailableStaffAction` in `app/Actions/Bookings/`
- [ ] `CancelBookingAction` in `app/Actions/Bookings/`
- [ ] `MarkBookingCompletedAction` in `app/Actions/Bookings/`
- [ ] `MarkBookingNoShowAction` in `app/Actions/Bookings/`
- [ ] `CreateBookingData` in `app/Data/`
- [ ] `BookingCreated` event in `app/Events/`
- [ ] `BookingCancelled` event in `app/Events/`
- [ ] `DispatchBookingConfirmationJob` listener in `app/Listeners/`
- [ ] `SlotNotAvailableException` in `app/Exceptions/`

### Enums & Models
- [ ] `BookingStatus` enum with: confirmed, completed, no_show, cancelled
- [ ] `BookingSource` enum with: online, manual
- [ ] `Booking` model with all relationships
- [ ] `Customer` model with `visit_count` field

### Database
- [ ] Composite index on `bookings(staff_id, starts_at, ends_at)`
- [ ] `migration:fresh` runs cleanly
- [ ] DemoBusinessSeeder creates sample data

### Tests
- [ ] `AvailabilityConflictTest` passes all 5 test methods
- [ ] `AnyAvailableStaffAssignmentTest` passes all 3 test methods
- [ ] `AvailabilityServiceTest` passes all test methods
- [ ] `php artisan test tests/Feature/Booking` runs all tests successfully

### Event Registration
- [ ] `EventServiceProvider` has `BookingCreated → DispatchBookingConfirmationJob`
- [ ] `EventServiceProvider` has `BookingCompleted → UpdateCustomerVisitStats` (if listener exists)

### Documentation
- [ ] All classes have proper docblocks
- [ ] All public methods have parameter/return types

After all items are checked, Phase 2 is complete and you can move to Phase 3 (API endpoints).