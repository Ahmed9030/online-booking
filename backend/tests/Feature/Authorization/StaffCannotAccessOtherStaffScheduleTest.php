<?php

namespace Tests\Feature\Authorization;

use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffCannotAccessOtherStaffScheduleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Verify that a staff member cannot view or modify another staff member's schedule.
     */
    public function test_staff_cannot_view_other_staff_schedule(): void
    {
        // Create a business and owner
        $owner = User::factory()->create(['role' => UserRole::OWNER]);
        $business = Business::factory()->create(['owner_user_id' => $owner->id]);

        // Create a branch
        $branch = Branch::factory()->create(['business_id' => $business->id]);

        // Create two staff members (A and B)
        $staffA = Staff::factory()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
        ]);

        $staffB = Staff::factory()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
        ]);

        // Create users for staff A and B
        $userA = User::factory()->create([
            'role' => UserRole::STAFF,
            'business_id' => $business->id,
            'staff_id' => $staffA->id,
        ]);

        $userB = User::factory()->create([
            'role' => UserRole::STAFF,
            'business_id' => $business->id,
            'staff_id' => $staffB->id,
        ]);

        // Create a booking for Staff B
        $bookingB = Booking::factory()->create([
            'business_id' => $business->id,
            'staff_id' => $staffB->id,
        ]);

        // Authenticate as Staff A
        $this->actingAs($userA);

        // Attempt to GET /api/v1/staff/schedule (should only return A's schedule)
        $response = $this->getJson('/api/v1/staff/schedule');
        $response->assertStatus(200);
        // Verify only Staff A's bookings are returned
        $bookings = $response->json('data');
        foreach ($bookings as $booking) {
            $this->assertNotEquals($staffB->id, $booking['staff_id']);
        }

        // Attempt to GET /api/v1/bookings/{id_of_staff_B}
        $response = $this->getJson("/api/v1/bookings/{$bookingB->id}");
        // Expected Result: API should return 403 Forbidden
        $response->assertStatus(403);
    }

    /**
     * Verify that a staff member cannot access another staff member's bookings.
     */
    public function test_staff_cannot_access_other_staff_bookings(): void
    {
        // Create a business
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);

        // Create two staff members
        $staffA = Staff::factory()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
        ]);
        $staffB = Staff::factory()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
        ]);

        // Create users for staff
        $userA = User::factory()->create([
            'role' => UserRole::STAFF,
            'business_id' => $business->id,
            'staff_id' => $staffA->id,
        ]);

        // Create a booking for Staff B
        $bookingB = Booking::factory()->create([
            'business_id' => $business->id,
            'staff_id' => $staffB->id,
        ]);

        // Authenticate as Staff A and try to access Staff B's booking
        $this->actingAs($userA);
        $response = $this->getJson("/api/v1/bookings/{$bookingB->id}");

        // Should return 403 Forbidden
        $response->assertStatus(403);
    }
}
