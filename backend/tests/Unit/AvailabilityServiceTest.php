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
