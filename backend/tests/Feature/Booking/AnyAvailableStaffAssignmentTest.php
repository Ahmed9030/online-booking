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
