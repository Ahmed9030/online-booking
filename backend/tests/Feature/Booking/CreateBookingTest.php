<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Actions\Bookings\CreateBookingAction;
use App\Data\CreateBookingData;
use App\Enums\BookingStatus;
use App\Events\BookingCreated;
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
        $startsAt = Carbon::parse('2026-06-30 14:00:00', 'Africa/Cairo');
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
        $cairoTime = Carbon::parse('2026-06-30 14:00:00', 'Africa/Cairo');
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

        // Convert the Cairo time to UTC to compare with stored UTC time
        $expectedUtc = $cairoTime->copy()->setTimezone('UTC');

        $this->assertEquals($expectedUtc->hour, $booking->starts_at->hour);
        $this->assertEquals($expectedUtc->minute, $booking->starts_at->minute);
        $this->assertEquals($expectedUtc->second, $booking->starts_at->second);
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

        $startsAt = Carbon::parse('2026-06-30 10:00:00', 'Africa/Cairo');
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
        $this->expectsEvents(BookingCreated::class);

        $startsAt = Carbon::parse('2026-06-30 14:00:00', 'Africa/Cairo');
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
        $startsAt = Carbon::parse('2026-06-30 14:00:00', 'Africa/Cairo');
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
        $base = Carbon::parse('2026-06-30 10:00:00', 'Africa/Cairo');

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
