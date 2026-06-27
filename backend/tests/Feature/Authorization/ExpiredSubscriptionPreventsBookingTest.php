<?php

namespace Tests\Feature\Authorization;

use App\Enums\SubscriptionStatus;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpiredSubscriptionPreventsBookingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Verify that a business with an expired subscription cannot create bookings.
     */
    public function test_expired_subscription_prevents_booking_creation(): void
    {
        // Create a business with expired subscription
        $business = Business::factory()->create([
            'subscription_status' => SubscriptionStatus::EXPIRED,
        ]);

        // Create a customer user
        $customer = User::factory()->create();

        // Try to create a booking via public endpoint
        $this->actingAs($customer);

        $bookingData = [
            'service_id' => \App\Models\Service::factory()->create(['business_id' => $business->id])->id,
            'starts_at' => now()->addHour()->toDateTimeString(),
        ];

        $response = $this->postJson('/api/v1/public/bookings', $bookingData);

        // Expected: 403 Forbidden or 422 Unprocessable
        $response->assertStatus([403, 422]);
    }

    /**
     * Verify that only active subscriptions allow booking creation.
     */
    public function test_active_subscription_allows_booking_creation(): void
    {
        // Create a business with active subscription
        $business = Business::factory()->create([
            'subscription_status' => SubscriptionStatus::ACTIVE,
        ]);

        $service = \App\Models\Service::factory()->create(['business_id' => $business->id]);
        $customer = User::factory()->create();

        // Try to create a booking
        $this->actingAs($customer);

        $bookingData = [
            'service_id' => $service->id,
            'starts_at' => now()->addHour()->toDateTimeString(),
        ];

        $response = $this->postJson('/api/v1/public/bookings', $bookingData);

        // Should succeed (200 or 201)
        $response->assertStatus([200, 201]);
    }
}
