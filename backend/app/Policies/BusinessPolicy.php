<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    public function view(User $user, Business $business): bool
    {
        return $user->id === $business->owner_user_id;
    }

    public function update(User $user, Business $business): bool
    {
        return $user->id === $business->owner_user_id;
    }
}
