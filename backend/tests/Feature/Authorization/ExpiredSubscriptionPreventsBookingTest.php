<?php

namespace Tests\Feature\Authorization;

use App\Enums\SubscriptionStatus;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Service;
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

        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $service = Service::factory()->create(['business_id' => $business->id]);

        // Create a customer user
        $customer = User::factory()->create();

        // Try to create a booking via public endpoint
        $this->actingAs($customer);

        $bookingData = [
            'branch_id' => $branch->id,
            'service_id' => $service->id,
            'customer_name' => 'أحمد محمد',
            'customer_phone' => '01012345678',
            'starts_at' => now()->addHour()->toDateTimeString(),
            'ends_at' => now()->addHours(2)->toDateTimeString(),
        ];

        $response = $this->postJson('/api/v1/public/bookings', $bookingData);

        // Expected: 403 Forbidden (subscription expired)
        $response->assertStatus(403);
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

        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $service = Service::factory()->create(['business_id' => $business->id]);
        $customer = User::factory()->create();

        // Try to create a booking
        $this->actingAs($customer);

        $bookingData = [
            'branch_id' => $branch->id,
            'service_id' => $service->id,
            'customer_name' => 'أحمد محمد',
            'customer_phone' => '01012345678',
            'starts_at' => now()->addHour()->toDateTimeString(),
            'ends_at' => now()->addHours(2)->toDateTimeString(),
        ];

        $response = $this->postJson('/api/v1/public/bookings', $bookingData);

        // Should succeed (201 Created)
        $response->assertStatus(201);
    }
}
