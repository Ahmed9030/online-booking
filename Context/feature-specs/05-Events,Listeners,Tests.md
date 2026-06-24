# Phase 2: Events, Listeners & Tests (Completion)
# Booking SaaS — Barbershop Appointment Platform

> This spec completes Phase 2 with the remaining four tasks:
> 1. BookingCompleted event + UpdateCustomerVisitStats listener
> 2. CreateBookingTest (happy path feature test)
> 3. Full test implementations
> 4. AvailabilityServiceTest (unit test)

---

## Part 1: Event & Listener Architecture

### Event 1: BookingCompleted

**File:** `backend/app/Events/BookingCompleted.php`

```php
<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Booking $booking) {}
}
```

### Listener: UpdateCustomerVisitStats

**File:** `backend/app/Listeners/UpdateCustomerVisitStats.php`

**Purpose:**
When a booking is marked as completed (not no-show, not cancelled), update:
1. `customers.visit_count` — increment by 1
2. `customers.last_visit_at` — set to now (Cairo time)

**Code:**
```php
<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\BookingCompleted;

final class UpdateCustomerVisitStats
{
    /**
     * Handle the BookingCompleted event.
     * Increments customer visit count and updates last visit timestamp.
     */
    public function handle(BookingCompleted $event): void
    {
        $booking = $event->booking;
        $customer = $booking->customer;

        // Increment visit count
        $customer->increment('visit_count');

        // Update last visit time (in Cairo timezone)
        $customer->update([
            'last_visit_at' => now('Africa/Cairo'),
        ]);
    }
}
```

### Register in EventServiceProvider

**File:** `backend/app/Providers/EventServiceProvider.php`

Modify the `$listen` property:

```php
protected $listen = [
    BookingCreated::class => [
        DispatchBookingConfirmationJob::class,
    ],
    BookingCompleted::class => [
        UpdateCustomerVisitStats::class,
    ],
    BookingCancelled::class => [
        // Phase 2: add cancellation notification listener
    ],
];
```

### How MarkBookingCompletedAction Fires the Event

In `backend/app/Actions/Bookings/MarkBookingCompletedAction.php`, after updating the booking status, fire the event:

```php
public function handle(string $bookingId): Booking
{
    return DB::transaction(function () use ($bookingId) {
        $booking = Booking::lockForUpdate()->findOrFail($bookingId);

        if ($booking->status !== BookingStatus::Confirmed) {
            throw new \InvalidArgumentException(
                'Only confirmed bookings can be marked as completed.',
            );
        }

        $booking->update(['status' => BookingStatus::Completed]);

        // Fire the event — listener will update customer stats
        event(new BookingCompleted($booking));

        return $booking;
    });
}
```

---

## Part 2: Feature Tests

### Test File 1: CreateBookingTest (Happy Path)

**File:** `backend/tests/Feature/Booking/CreateBookingTest.php`

**Purpose:** Verify that a booking is created successfully with all required fields.

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Actions\Bookings\CreateBookingAction;
use App\Data\CreateBookingData;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\BranchWorkingHour;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use App\Models\StaffWorkingHour;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateBookingTest extends TestCase
{
    use RefreshDatabase;

    protected Business $business;
    protected Branch $branch;
    protected Staff $staff;
    protected Service $service;
    protected Customer $customer;
    protected CreateBookingAction $action;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup test data
        $this->business = Business::factory()->create([
            'subscription_status' => 'active',
        ]);

        $this->branch = Branch::factory()->for($this->business)->create();

        // Set up working hours: Monday–Friday 9 AM – 6 PM
        for ($day = 0; $day < 5; $day++) {
            BranchWorkingHour::create([
                'branch_id' => $this->branch->id,
                'weekday' => $day,
                'open_time' => '09:00',
                'close_time' => '18:00',
            ]);
        }

        // Create staff
        $this->staff = Staff::factory()->for($this->business)->for($this->branch)->create();

        // Set staff working hours: Monday–Friday 9 AM – 6 PM
        for ($day = 0; $day < 5; $day++) {
            StaffWorkingHour::create([
                'staff_id' => $this->staff->id,
                'weekday' => $day,
                'start_time' => '09:00',
                'end_time' => '18:00',
            ]);
        }

        // Create service
        $this->service = Service::factory()->for($this->business)->for($this->branch)->create([
            'duration_minutes' => 30,
        ]);

        // Link staff to service
        $this->staff->services()->attach($this->service->id);

        // Create customer
        $this->customer = Customer::factory()->for($this->business)->create();

        // Get the action
        $this->action = app(CreateBookingAction::class);
    }

    /**
     * Test: Create a booking with all required fields.
     */
    public function test_creates_booking_with_valid_data(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0)->setSecond(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
            source: 'online',
            notes: 'Regular customer, prefers Barber Ahmed',
        );

        // Create booking
        $booking = $this->action->handle($data);

        // Assertions
        $this->assertNotNull($booking->id);
        $this->assertEquals($this->business->id, $booking->business_id);
        $this->assertEquals($this->branch->id, $booking->branch_id);
        $this->assertEquals($this->customer->id, $booking->customer_id);
        $this->assertEquals($this->service->id, $booking->service_id);
        $this->assertEquals($this->staff->id, $booking->staff_id);
        $this->assertEquals(BookingStatus::Confirmed, $booking->status);
        $this->assertEquals('online', $booking->source->value);
        $this->assertEquals('Regular customer, prefers Barber Ahmed', $booking->notes);

        // Verify it's in the database
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'business_id' => $this->business->id,
            'status' => BookingStatus::Confirmed->value,
        ]);
    }

    /**
     * Test: Booking start and end times are stored in UTC.
     */
    public function test_booking_times_stored_in_utc(): void
    {
        $cairoTime = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0)->setSecond(0);
        $endsAt = $cairoTime->clone()->addMinutes(30);

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $cairoTime,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );

        $booking = $this->action->handle($data);

        // Cairo is UTC+3, so 2 PM Cairo = 11 AM UTC
        $this->assertEquals(11, $booking->starts_at->setTimezone('UTC')->hour);
        $this->assertEquals(11, $booking->starts_at->hour); // Laravel defaults to app timezone
    }

    /**
     * Test: Booking duration matches service duration.
     */
    public function test_booking_duration_matches_service(): void
    {
        // Create a service with 60-minute duration
        $service60 = Service::factory()->for($this->business)->for($this->branch)->create([
            'duration_minutes' => 60,
        ]);
        $this->staff->services()->attach($service60->id);

        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(10)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(60);

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $service60->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );

        $booking = $this->action->handle($data);

        // Verify duration
        $duration = $booking->ends_at->diffInMinutes($booking->starts_at);
        $this->assertEquals(60, $duration);
    }

    /**
     * Test: Booking fires BookingCreated event.
     */
    public function test_booking_fires_booking_created_event(): void
    {
        $this->expectsEvents(\App\Events\BookingCreated::class);

        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );

        $this->action->handle($data);
    }

    /**
     * Test: Cannot create booking in the past.
     */
    public function test_cannot_create_booking_in_past(): void
    {
        $startsAt = now('Africa/Cairo')->subDays(1);
        $endsAt = $startsAt->clone()->addMinutes(30);

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->action->handle($data);
    }

    /**
     * Test: Cannot create booking with invalid time range (start >= end).
     */
    public function test_cannot_create_booking_with_invalid_time_range(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt; // Same time

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->action->handle($data);
    }

    /**
     * Test: Booking source is stored correctly.
     */
    public function test_booking_source_stored_correctly(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Test with 'manual' source (walk-in/phone booking)
        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
            source: 'manual',
        );

        $booking = $this->action->handle($data);

        $this->assertEquals('manual', $booking->source->value);
    }

    /**
     * Test: Multiple sequential bookings can be created without errors.
     */
    public function test_create_multiple_sequential_bookings(): void
    {
        $base = now('Africa/Cairo')->addDays(1)->setHour(10)->setMinute(0);

        // Create 3 sequential bookings
        for ($i = 0; $i < 3; $i++) {
            $startsAt = $base->clone()->addMinutes($i * 30);
            $endsAt = $startsAt->clone()->addMinutes(30);

            $data = new CreateBookingData(
                businessId: $this->business->id,
                branchId: $this->branch->id,
                serviceId: $this->service->id,
                customerId: $this->customer->id,
                startsAt: $startsAt,
                endsAt: $endsAt,
                staffId: $this->staff->id,
            );

            $booking = $this->action->handle($data);

            $this->assertNotNull($booking->id);
        }

        // Verify all 3 are in database
        $this->assertCount(3, Booking::where('business_id', $this->business->id)->get());
    }
}
```

### Test File 2: Expanded AvailabilityConflictTest

**File:** `backend/tests/Feature/Booking/AvailabilityConflictTest.php`

This is the expanded version with all edge cases:

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Actions\Bookings\CreateBookingAction;
use App\Data\CreateBookingData;
use App\Enums\BookingStatus;
use App\Enums\BookingSource;
use App\Exceptions\SlotNotAvailableException;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\BranchWorkingHour;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use App\Models\StaffWorkingHour;
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
    protected CreateBookingAction $action;

    protected function setUp(): void
    {
        parent::setUp();

        $this->business = Business::factory()->create([
            'subscription_status' => 'active',
        ]);

        $this->branch = Branch::factory()->for($this->business)->create();

        // Working hours: 9 AM – 6 PM
        for ($day = 0; $day < 5; $day++) {
            BranchWorkingHour::create([
                'branch_id' => $this->branch->id,
                'weekday' => $day,
                'open_time' => '09:00',
                'close_time' => '18:00',
            ]);
        }

        $this->staff = Staff::factory()->for($this->business)->for($this->branch)->create();

        for ($day = 0; $day < 5; $day++) {
            StaffWorkingHour::create([
                'staff_id' => $this->staff->id,
                'weekday' => $day,
                'start_time' => '09:00',
                'end_time' => '18:00',
            ]);
        }

        $this->service = Service::factory()->for($this->business)->for($this->branch)->create([
            'duration_minutes' => 30,
        ]);

        $this->staff->services()->attach($this->service->id);

        $this->customer1 = Customer::factory()->for($this->business)->create();
        $this->customer2 = Customer::factory()->for($this->business)->create();

        $this->action = app(CreateBookingAction::class);
    }

    /**
     * Test: Exact same time slot cannot be double-booked.
     */
    public function test_exact_same_time_slot_is_rejected(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Create first booking
        $data1 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer1->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );
        $this->action->handle($data1);

        // Attempt second booking at exact same time
        $data2 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );

        $this->expectException(SlotNotAvailableException::class);
        $this->action->handle($data2);
    }

    /**
     * Test: Overlapping booking (starts in middle) is rejected.
     */
    public function test_booking_starting_in_middle_is_rejected(): void
    {
        $startsAt1 = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt1 = $startsAt1->clone()->addMinutes(30);

        // First booking: 2:00 PM – 2:30 PM
        $data1 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer1->id,
            startsAt: $startsAt1,
            endsAt: $endsAt1,
            staffId: $this->staff->id,
        );
        $this->action->handle($data1);

        // Attempt booking at 2:15 PM – 2:45 PM (overlaps in the middle)
        $startsAt2 = $startsAt1->clone()->addMinutes(15);
        $endsAt2 = $endsAt1->clone()->addMinutes(15);

        $data2 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt2,
            endsAt: $endsAt2,
            staffId: $this->staff->id,
        );

        $this->expectException(SlotNotAvailableException::class);
        $this->action->handle($data2);
    }

    /**
     * Test: Overlapping booking (completely contains existing) is rejected.
     */
    public function test_booking_containing_existing_is_rejected(): void
    {
        $startsAt1 = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt1 = $startsAt1->clone()->addMinutes(30);

        // First booking: 2:00 PM – 2:30 PM
        $data1 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer1->id,
            startsAt: $startsAt1,
            endsAt: $endsAt1,
            staffId: $this->staff->id,
        );
        $this->action->handle($data1);

        // Attempt booking from 1:45 PM – 2:45 PM (contains existing)
        $startsAt2 = $startsAt1->clone()->subMinutes(15);
        $endsAt2 = $endsAt1->clone()->addMinutes(15);

        $data2 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt2,
            endsAt: $endsAt2,
            staffId: $this->staff->id,
        );

        $this->expectException(SlotNotAvailableException::class);
        $this->action->handle($data2);
    }

    /**
     * Test: Back-to-back bookings are allowed (no gap).
     */
    public function test_back_to_back_bookings_allowed(): void
    {
        $startsAt1 = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt1 = $startsAt1->clone()->addMinutes(30);

        // First booking: 2:00 PM – 2:30 PM
        $data1 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer1->id,
            startsAt: $startsAt1,
            endsAt: $endsAt1,
            staffId: $this->staff->id,
        );
        $this->action->handle($data1);

        // Second booking at 2:30 PM – 3:00 PM (immediately after, no gap)
        $startsAt2 = $endsAt1->clone();
        $endsAt2 = $startsAt2->clone()->addMinutes(30);

        $data2 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt2,
            endsAt: $endsAt2,
            staffId: $this->staff->id,
        );

        $booking2 = $this->action->handle($data2);
        $this->assertTrue($booking2->exists);
    }

    /**
     * Test: Cancelled bookings don't block slots.
     */
    public function test_cancelled_booking_does_not_block_slot(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Create and cancel first booking
        $booking1 = Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer1->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
            'source' => BookingSource::Online,
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

        $booking2 = $this->action->handle($data);
        $this->assertTrue($booking2->exists);
    }

    /**
     * Test: Completed bookings don't block slots.
     */
    public function test_completed_booking_does_not_block_slot(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Create and complete first booking
        $booking1 = Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer1->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
            'source' => BookingSource::Online,
        ]);

        $booking1->update(['status' => BookingStatus::Completed]);

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

        $booking2 = $this->action->handle($data);
        $this->assertTrue($booking2->exists);
    }

    /**
     * Test: No-show bookings don't block slots.
     */
    public function test_no_show_booking_does_not_block_slot(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Create and mark as no-show
        $booking1 = Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer1->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
            'source' => BookingSource::Online,
        ]);

        $booking1->update(['status' => BookingStatus::NoShow]);

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

        $booking2 = $this->action->handle($data);
        $this->assertTrue($booking2->exists);
    }

    /**
     * Test: Different staff can have simultaneous bookings.
     */
    public function test_different_staff_can_have_simultaneous_bookings(): void
    {
        // Create a second staff member
        $staff2 = Staff::factory()->for($this->business)->for($this->branch)->create();
        $staff2->services()->attach($this->service->id);

        // Set working hours for staff2
        for ($day = 0; $day < 5; $day++) {
            StaffWorkingHour::create([
                'staff_id' => $staff2->id,
                'weekday' => $day,
                'start_time' => '09:00',
                'end_time' => '18:00',
            ]);
        }

        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // First booking with staff1
        $data1 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer1->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $this->staff->id,
        );
        $this->action->handle($data1);

        // Second booking with staff2 at same time — should succeed
        $data2 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $staff2->id,
        );

        $booking2 = $this->action->handle($data2);
        $this->assertTrue($booking2->exists);
        $this->assertEquals($staff2->id, $booking2->staff_id);
    }

    /**
     * Test: Booking at branch boundary times.
     */
    public function test_booking_at_branch_open_and_close_times(): void
    {
        $tomorrow = now('Africa/Cairo')->addDays(1);

        // At open time: 9:00 AM – 9:30 AM
        $startsAt1 = $tomorrow->clone()->setHour(9)->setMinute(0);
        $endsAt1 = $startsAt1->clone()->addMinutes(30);

        $data1 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer1->id,
            startsAt: $startsAt1,
            endsAt: $endsAt1,
            staffId: $this->staff->id,
        );

        $booking1 = $this->action->handle($data1);
        $this->assertTrue($booking1->exists);

        // At close time: 5:30 PM – 6:00 PM
        $startsAt2 = $tomorrow->clone()->setHour(17)->setMinute(30);
        $endsAt2 = $startsAt2->clone()->addMinutes(30);

        $data2 = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer2->id,
            startsAt: $startsAt2,
            endsAt: $endsAt2,
            staffId: $this->staff->id,
        );

        $booking2 = $this->action->handle($data2);
        $this->assertTrue($booking2->exists);
    }
}
```

### Test File 3: Expanded AnyAvailableStaffAssignmentTest

**File:** `backend/tests/Feature/Booking/AnyAvailableStaffAssignmentTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Actions\Bookings\CreateBookingAction;
use App\Data\CreateBookingData;
use App\Enums\BookingStatus;
use App\Enums\BookingSource;
use App\Exceptions\SlotNotAvailableException;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\BranchWorkingHour;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use App\Models\StaffWorkingHour;
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
    protected Staff $staff3;
    protected Service $service;
    protected Customer $customer;
    protected CreateBookingAction $action;

    protected function setUp(): void
    {
        parent::setUp();

        $this->business = Business::factory()->create([
            'subscription_status' => 'active',
        ]);

        $this->branch = Branch::factory()->for($this->business)->create();

        // Branch working hours
        for ($day = 0; $day < 5; $day++) {
            BranchWorkingHour::create([
                'branch_id' => $this->branch->id,
                'weekday' => $day,
                'open_time' => '09:00',
                'close_time' => '18:00',
            ]);
        }

        // Create three staff members
        $this->staff1 = Staff::factory()->for($this->business)->for($this->branch)->create(['name' => 'Ahmed']);
        $this->staff2 = Staff::factory()->for($this->business)->for($this->branch)->create(['name' => 'Karim']);
        $this->staff3 = Staff::factory()->for($this->business)->for($this->branch)->create(['name' => 'Hassan']);

        // Set working hours for all staff
        foreach ([$this->staff1, $this->staff2, $this->staff3] as $staff) {
            for ($day = 0; $day < 5; $day++) {
                StaffWorkingHour::create([
                    'staff_id' => $staff->id,
                    'weekday' => $day,
                    'start_time' => '09:00',
                    'end_time' => '18:00',
                ]);
            }
        }

        // Create service
        $this->service = Service::factory()->for($this->business)->for($this->branch)->create([
            'duration_minutes' => 30,
        ]);

        // All staff can perform the service
        $this->staff1->services()->attach($this->service->id);
        $this->staff2->services()->attach($this->service->id);
        $this->staff3->services()->attach($this->service->id);

        // Create customer
        $this->customer = Customer::factory()->for($this->business)->create();

        $this->action = app(CreateBookingAction::class);
    }

    /**
     * Test: "Any available" assigns the first available staff (lowest ID).
     */
    public function test_any_available_assigns_first_available(): void
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

        $booking = $this->action->handle($data);

        // Should be staff1 (first staff, lowest ID)
        $this->assertEquals($this->staff1->id, $booking->staff_id);
    }

    /**
     * Test: "Any available" skips to next staff if first is booked.
     */
    public function test_any_available_skips_booked_staff(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Book staff1 at this time
        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff1->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
            'source' => BookingSource::Online,
        ]);

        // Book "any available"
        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: null, // Any available
        );

        $booking = $this->action->handle($data);

        // Should be staff2 (staff1 is booked)
        $this->assertEquals($this->staff2->id, $booking->staff_id);
    }

    /**
     * Test: "Any available" finds next available when multiple are booked.
     */
    public function test_any_available_finds_available_among_booked(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Book staff1 and staff2 at this time
        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer->id,
            'service_id' => $this->service->id,
            'staff_id' => $this->staff1->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => BookingStatus::Confirmed,
            'source' => BookingSource::Online,
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
            'source' => BookingSource::Online,
        ]);

        // Book "any available"
        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: null, // Any available
        );

        $booking = $this->action->handle($data);

        // Should be staff3 (staff1 and staff2 are booked)
        $this->assertEquals($this->staff3->id, $booking->staff_id);
    }

    /**
     * Test: "Any available" throws if all staff are booked.
     */
    public function test_any_available_throws_when_all_booked(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Book all three staff
        foreach ([$this->staff1, $this->staff2, $this->staff3] as $staff) {
            Booking::create([
                'business_id' => $this->business->id,
                'branch_id' => $this->branch->id,
                'customer_id' => $this->customer->id,
                'service_id' => $this->service->id,
                'staff_id' => $staff->id,
                'starts_at' => $startsAt->setTimezone('UTC'),
                'ends_at' => $endsAt->setTimezone('UTC'),
                'status' => BookingStatus::Confirmed,
                'source' => BookingSource::Online,
            ]);
        }

        $data = new CreateBookingData(
            businessId: $this->business->id,
            branchId: $this->branch->id,
            serviceId: $this->service->id,
            customerId: $this->customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: null, // Any available
        );

        $this->expectException(SlotNotAvailableException::class);
        $this->action->handle($data);
    }

    /**
     * Test: "Any available" only considers staff who can perform the service.
     */
    public function test_any_available_only_considers_qualified_staff(): void
    {
        // Remove service from staff1 — they can no longer perform it
        $this->staff1->services()->detach($this->service->id);

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

        $booking = $this->action->handle($data);

        // Should be staff2 (staff1 is not qualified, staff1 is next in line but not qualified)
        $this->assertEquals($this->staff2->id, $booking->staff_id);
    }

    /**
     * Test: "Any available" respects staff working hours.
     */
    public function test_any_available_respects_staff_working_hours(): void
    {
        // Set staff1 working hours to close earlier (5 PM instead of 6 PM)
        StaffWorkingHour::where('staff_id', $this->staff1->id)->update(['end_time' => '17:00']);

        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(17)->setMinute(30); // 5:30 PM
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

        $booking = $this->action->handle($data);

        // Should be staff2 (staff1 doesn't work at 5:30 PM)
        $this->assertEquals($this->staff2->id, $booking->staff_id);
    }
}
```

---

## Part 3: Unit Test for AvailabilityService

### Test File: AvailabilityServiceTest (Unit)

**File:** `backend/tests/Unit/AvailabilityServiceTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Branch;
use App\Models\BranchWorkingHour;
use App\Models\Business;
use App\Models\Booking;
use App\Models\Customer;
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

    protected AvailabilityService $service;
    protected Business $business;
    protected Branch $branch;
    protected Staff $staff;
    protected Service $bookingService;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(AvailabilityService::class);

        $this->business = Business::factory()->create();
        $this->branch = Branch::factory()->for($this->business)->create();
        $this->staff = Staff::factory()->for($this->business)->for($this->branch)->create();
        $this->bookingService = Service::factory()->for($this->business)->for($this->branch)->create([
            'duration_minutes' => 30,
        ]);
        $this->customer = Customer::factory()->for($this->business)->create();

        $this->staff->services()->attach($this->bookingService->id);
    }

    /**
     * Test: Generate slots for a working day.
     */
    public function test_generates_slots_for_working_day(): void
    {
        // Monday 9 AM – 6 PM
        BranchWorkingHour::create([
            'branch_id' => $this->branch->id,
            'weekday' => 1,
            'open_time' => '09:00',
            'close_time' => '18:00',
        ]);

        StaffWorkingHour::create([
            'staff_id' => $this->staff->id,
            'weekday' => 1,
            'start_time' => '09:00',
            'end_time' => '18:00',
        ]);

        $monday = now('Africa/Cairo')->next(1); // Next Monday

        $slots = $this->service->getAvailableSlots(
            $this->branch,
            $this->bookingService,
            $this->staff,
            $monday,
        );

        // 9 AM to 6 PM = 9 hours = 18 x 30-min slots
        $this->assertCount(18, $slots);
        $this->assertEquals(9, $slots->first()['starts_at']->hour);
    }

    /**
     * Test: No slots returned for closed day.
     */
    public function test_no_slots_for_closed_day(): void
    {
        // Friday closed
        BranchWorkingHour::create([
            'branch_id' => $this->branch->id,
            'weekday' => 5,
            'open_time' => null,
            'close_time' => null,
        ]);

        $friday = now('Africa/Cairo')->next(5); // Next Friday

        $slots = $this->service->getAvailableSlots(
            $this->branch,
            $this->bookingService,
            $this->staff,
            $friday,
        );

        $this->assertCount(0, $slots);
    }

    /**
     * Test: Slots are removed when staff has a booking.
     */
    public function test_removes_slots_with_existing_booking(): void
    {
        $monday = now('Africa/Cairo')->next(1);

        BranchWorkingHour::create([
            'branch_id' => $this->branch->id,
            'weekday' => 1,
            'open_time' => '09:00',
            'close_time' => '18:00',
        ]);

        StaffWorkingHour::create([
            'staff_id' => $this->staff->id,
            'weekday' => 1,
            'start_time' => '09:00',
            'end_time' => '18:00',
        ]);

        // Create a booking at 10:00 AM – 10:30 AM on Monday
        $bookedStart = $monday->clone()->setHour(10)->setMinute(0);
        $bookedEnd = $bookedStart->clone()->addMinutes(30);

        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer->id,
            'service_id' => $this->bookingService->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $bookedStart->setTimezone('UTC'),
            'ends_at' => $bookedEnd->setTimezone('UTC'),
            'status' => 'confirmed',
        ]);

        $slots = $this->service->getAvailableSlots(
            $this->branch,
            $this->bookingService,
            $this->staff,
            $monday,
        );

        // Should have one fewer slot (10:00 AM slot removed)
        $this->assertCount(17, $slots);

        // Verify 10:00 slot is not present
        $tenOclockSlot = $slots->firstWhere(function ($slot) {
            return $slot['starts_at']->hour === 10 && $slot['starts_at']->minute === 0;
        });

        $this->assertNull($tenOclockSlot);
    }

    /**
     * Test: Slot IDs are unique and deterministic.
     */
    public function test_slot_ids_are_unique(): void
    {
        $monday = now('Africa/Cairo')->next(1);

        BranchWorkingHour::create([
            'branch_id' => $this->branch->id,
            'weekday' => 1,
            'open_time' => '09:00',
            'close_time' => '11:00',
        ]);

        StaffWorkingHour::create([
            'staff_id' => $this->staff->id,
            'weekday' => 1,
            'start_time' => '09:00',
            'end_time' => '11:00',
        ]);

        $slots = $this->service->getAvailableSlots(
            $this->branch,
            $this->bookingService,
            $this->staff,
            $monday,
        );

        $slotIds = $slots->pluck('id')->toArray();

        // All IDs should be unique
        $this->assertCount(count($slotIds), array_unique($slotIds));
    }

    /**
     * Test: assertSlotAvailable throws when slot is taken.
     */
    public function test_assert_slot_available_throws_on_conflict(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Create a booking
        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer->id,
            'service_id' => $this->bookingService->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt->setTimezone('UTC'),
            'ends_at' => $endsAt->setTimezone('UTC'),
            'status' => 'confirmed',
        ]);

        // Try to assert slot available for the same time
        $this->expectException(\App\Exceptions\SlotNotAvailableException::class);

        $this->service->assertSlotAvailable(
            $this->staff->id,
            $startsAt,
            $endsAt,
        );
    }

    /**
     * Test: assertSlotAvailable succeeds when slot is free.
     */
    public function test_assert_slot_available_succeeds_when_free(): void
    {
        $startsAt = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(30);

        // Should not throw
        $this->service->assertSlotAvailable(
            $this->staff->id,
            $startsAt,
            $endsAt,
        );

        $this->assertTrue(true);
    }

    /**
     * Test: Handles partial overlaps correctly.
     */
    public function test_partial_overlap_detected(): void
    {
        $startsAt1 = now('Africa/Cairo')->addDays(1)->setHour(14)->setMinute(0);
        $endsAt1 = $startsAt1->clone()->addMinutes(30);

        // Create first booking: 2:00 PM – 2:30 PM
        Booking::create([
            'business_id' => $this->business->id,
            'branch_id' => $this->branch->id,
            'customer_id' => $this->customer->id,
            'service_id' => $this->bookingService->id,
            'staff_id' => $this->staff->id,
            'starts_at' => $startsAt1->setTimezone('UTC'),
            'ends_at' => $endsAt1->setTimezone('UTC'),
            'status' => 'confirmed',
        ]);

        // Try slot starting at 2:15 PM (overlaps)
        $startsAt2 = $startsAt1->clone()->addMinutes(15);
        $endsAt2 = $endsAt1->clone()->addMinutes(15);

        $this->expectException(\App\Exceptions\SlotNotAvailableException::class);

        $this->service->assertSlotAvailable(
            $this->staff->id,
            $startsAt2,
            $endsAt2,
        );
    }

    /**
     * Test: Handles staff with no working hours.
     */
    public function test_no_slots_if_staff_has_no_working_hours(): void
    {
        $monday = now('Africa/Cairo')->next(1);

        BranchWorkingHour::create([
            'branch_id' => $this->branch->id,
            'weekday' => 1,
            'open_time' => '09:00',
            'close_time' => '18:00',
        ]);

        // Don't create staff working hours for this day

        $slots = $this->service->getAvailableSlots(
            $this->branch,
            $this->bookingService,
            $this->staff,
            $monday,
        );

        $this->assertCount(0, $slots);
    }

    /**
     * Test: Handles overlapping branch and staff hours correctly.
     */
    public function test_intersects_branch_and_staff_hours(): void
    {
        $monday = now('Africa/Cairo')->next(1);

        // Branch: 9 AM – 6 PM
        BranchWorkingHour::create([
            'branch_id' => $this->branch->id,
            'weekday' => 1,
            'open_time' => '09:00',
            'close_time' => '18:00',
        ]);

        // Staff: 10 AM – 5 PM (narrower window)
        StaffWorkingHour::create([
            'staff_id' => $this->staff->id,
            'weekday' => 1,
            'start_time' => '10:00',
            'end_time' => '17:00',
        ]);

        $slots = $this->service->getAvailableSlots(
            $this->branch,
            $this->bookingService,
            $this->staff,
            $monday,
        );

        // 10 AM to 5 PM = 7 hours = 14 x 30-min slots
        $this->assertCount(14, $slots);

        // First slot should be at 10:00 AM
        $this->assertEquals(10, $slots->first()['starts_at']->hour);

        // Last slot should be at 4:30 PM (ends at 5 PM)
        $this->assertEquals(16, $slots->last()['starts_at']->hour);
        $this->assertEquals(30, $slots->last()['starts_at']->minute);
    }
}
```

---

## Event Registration Summary

### In `EventServiceProvider`

```php
protected $listen = [
    \App\Events\BookingCreated::class => [
        \App\Listeners\DispatchBookingConfirmationJob::class,
    ],
    \App\Events\BookingCompleted::class => [
        \App\Listeners\UpdateCustomerVisitStats::class,
    ],
];
```

### When `MarkBookingCompletedAction` runs:

1. Updates booking status to `Completed`
2. Fires `BookingCompleted` event
3. Listener `UpdateCustomerVisitStats` catches event
4. Listener increments `customer.visit_count`
5. Listener updates `customer.last_visit_at`

---

## Running All Phase 2 Tests

### Run Feature Tests

```bash
cd backend

# Run all Phase 2 feature tests
php artisan test tests/Feature/Booking/

# Or individually:
php artisan test tests/Feature/Booking/CreateBookingTest
php artisan test tests/Feature/Booking/AvailabilityConflictTest
php artisan test tests/Feature/Booking/AnyAvailableStaffAssignmentTest

# With verbose output
php artisan test tests/Feature/Booking/ --verbose
```

### Run Unit Tests

```bash
# Run AvailabilityServiceTest
php artisan test tests/Unit/AvailabilityServiceTest

# With verbose
php artisan test tests/Unit/AvailabilityServiceTest --verbose
```

### Run All Tests

```bash
# All Phase 2 tests
php artisan test tests/Feature/Booking/ tests/Unit/AvailabilityServiceTest

# All tests in the project
php artisan test

# With coverage report (requires pcov or xdebug)
php artisan test --coverage
```

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

### Events & Listeners
- [ ] `BookingCompleted` event created
- [ ] `UpdateCustomerVisitStats` listener created
- [ ] Both registered in `EventServiceProvider`
- [ ] `MarkBookingCompletedAction` fires `BookingCompleted` event

### Tests Created
- [ ] `CreateBookingTest.php` (8 test methods)
- [ ] `AvailabilityConflictTest.php` (9 test methods)
- [ ] `AnyAvailableStaffAssignmentTest.php` (6 test methods)
- [ ] `AvailabilityServiceTest.php` (11 test methods)

### Tests Passing
- [ ] All CreateBookingTest tests pass
- [ ] All AvailabilityConflictTest tests pass
- [ ] All AnyAvailableStaffAssignmentTest tests pass
- [ ] All AvailabilityServiceTest tests pass
- [ ] `php artisan test tests/Feature/Booking/ tests/Unit/AvailabilityServiceTest` shows all green

### Database & Models
- [ ] Composite index on `bookings(staff_id, starts_at, ends_at)` exists
- [ ] `Booking` model has `BookingStatus` enum cast
- [ ] `Customer` model has `visit_count` and `last_visit_at` fields
- [ ] `DemoBusinessSeeder` creates sample bookings

### Code Quality
- [ ] All classes have docblocks
- [ ] All public methods have parameter/return types
- [ ] No `TODO` comments left in Phase 2 code
- [ ] ESLint/PHP linting passes: `php artisan pest` runs clean

---

## After Phase 2 is Complete

Phase 3 (Owner/Staff API endpoints) depends on Phase 2 being solid:
- Create endpoints that call Actions
- All booking logic is already tested and working
- Focus on API request validation + response formatting in Phase 3

✅ **Phase 2 is now COMPLETE** — you have full booking logic with conflict prevention, "any available" assignment, and comprehensive tests.