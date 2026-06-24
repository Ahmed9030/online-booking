<?php

namespace App\Policies;

use App\Models\Staff;
use App\Models\User;

class StaffPolicy
{
    public function view(User $user, Staff $staff): bool
    {
        // Owner can view all staff in their business
        if ($user->hasRole('owner') && $user->business_id === $staff->business_id) {
            return true;
        }

        // Staff can only view their own profile
        if ($user->hasRole('staff') && $user->staff_id === $staff->id) {
            return true;
        }

        return false;
    }

    public function update(User $user, Staff $staff): bool
    {
        return $user->hasRole('owner') && $user->business_id === $staff->business_id;
    }

    public function manageHours(User $user, Staff $staff): bool
    {
        return $user->hasRole('owner') && $user->business_id === $staff->business_id;
    }
}
