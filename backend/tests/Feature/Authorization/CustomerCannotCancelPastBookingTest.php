<?php

namespace Tests\Feature\Authorization;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerCannotCancelPastBookingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Verify that a customer cannot cancel a booking that is in the past.
     */
    public function test_customer_cannot_cancel_past_booking(): void
    {
        // Create a business and customer
        $business = Business::factory()->create();
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        // Create a booking in the past
        $pastBooking = Booking::factory()->create([
            'business_id' => $business->id,
            'starts_at' => now()->subHours(2),
            'status' => BookingStatus::COMPLETED,
        ]);

        // Authenticate as customer and try to cancel
        $this->actingAs($customer);

        $response = $this->patchJson("/api/v1/bookings/{$pastBooking->id}/cancel");

        // Should return 403 or 422 (cannot cancel completed/past booking)
        $this->assertContains($response->status(), [403, 422]);
    }

    /**
     * Verify that a customer can cancel a future booking.
     */
    public function test_customer_can_cancel_future_booking(): void
    {
        // Create a business and customer
        $business = Business::factory()->create();
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        // Create a booking in the future
        $futureBooking = Booking::factory()->create([
            'business_id' => $business->id,
            'starts_at' => now()->addHours(2),
            'status' => BookingStatus::CONFIRMED,
        ]);

        // Authenticate as customer and try to cancel
        $this->actingAs($customer);

        $response = $this->patchJson("/api/v1/bookings/{$futureBooking->id}/cancel");

        // Should succeed (200 or 204)
        $this->assertContains($response->status(), [200, 204]);
    }

    /**
     * Verify that bookings cannot be cancelled less than a minimum time before start.
     */
    public function test_booking_cannot_be_cancelled_too_close_to_start_time(): void
    {
        // Create a business and customer
        $business = Business::factory()->create();
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        // Create a booking starting in 1 hour (often businesses require 24 hours notice)
        $soonBooking = Booking::factory()->create([
            'business_id' => $business->id,
            'starts_at' => now()->addHour(),
            'status' => BookingStatus::CONFIRMED,
        ]);

        // Authenticate as customer and try to cancel
        $this->actingAs($customer);

        $response = $this->patchJson("/api/v1/bookings/{$soonBooking->id}/cancel");

        // Should return 422 (unprocessable - cancellation window closed)
        $response->assertStatus(422);
    }
}
