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
