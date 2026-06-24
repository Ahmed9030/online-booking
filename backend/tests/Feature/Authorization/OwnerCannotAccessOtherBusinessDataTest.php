<?php

namespace Tests\Feature\Authorization;

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerCannotAccessOtherBusinessDataTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Verify that an owner cannot access another owner's business data (multi-tenancy isolation).
     */
    public function test_owner_cannot_view_other_business(): void
    {
        // Create two businesses with different owners
        $owner1 = User::factory()->create(['role' => UserRole::OWNER]);
        $business1 = Business::factory()->create(['owner_id' => $owner1->id]);

        $owner2 = User::factory()->create(['role' => UserRole::OWNER]);
        $business2 = Business::factory()->create(['owner_id' => $owner2->id]);

        // Create branches for business 2
        $branch2 = Branch::factory()->create(['business_id' => $business2->id]);

        // Authenticate as owner1 and try to access business2's branch
        $this->actingAs($owner1);

        // Attempt to view business2's branch - should return 403 or empty results
        $response = $this->getJson("/api/v1/branches/{$branch2->id}");
        $response->assertStatus(403);
    }

    /**
     * Verify that an owner can only access their own branches.
     */
    public function test_owner_can_only_list_their_branches(): void
    {
        // Create two owners and businesses
        $owner1 = User::factory()->create(['role' => UserRole::OWNER]);
        $business1 = Business::factory()->create(['owner_id' => $owner1->id]);

        $owner2 = User::factory()->create(['role' => UserRole::OWNER]);
        $business2 = Business::factory()->create(['owner_id' => $owner2->id]);

        // Create branches for both businesses
        $branch1 = Branch::factory()->create(['business_id' => $business1->id]);
        $branch2 = Branch::factory()->create(['business_id' => $business2->id]);

        // Authenticate as owner1 and list branches
        $this->actingAs($owner1);
        $response = $this->getJson('/api/v1/branches');

        // Should only see branch1 in results
        $branches = $response->json('data');
        $this->assertTrue(
            collect($branches)->every(fn($branch) => $branch['id'] !== $branch2->id)
        );
    }
}
