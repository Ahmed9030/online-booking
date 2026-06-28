<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    /**
     * Determine if the user can view the business details.
     * Only the business owner can view their own business.
     */
    public function view(User $user, Business $business): bool
    {
        return $user->id === $business->owner_user_id;
    }

    /**
     * Determine if the user can update the business.
     * Only the business owner can update their own business.
     */
    public function update(User $user, Business $business): bool
    {
        return $user->id === $business->owner_user_id;
    }
}
