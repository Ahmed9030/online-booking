<?php

namespace App\Policies;

use App\Models\Staff;
use App\Models\User;

class StaffPolicy
{
    /**
     * Determine if the user can view the staff member.
     * Owners see all staff in their business; staff see only themselves.
     */
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

    /**
     * Determine if the user can update the staff member.
     * Only owners of the same business can update.
     */
    public function update(User $user, Staff $staff): bool
    {
        return $user->hasRole('owner') && $user->business_id === $staff->business_id;
    }

    /**
     * Determine if the user can manage staff working hours.
     * Only owners of the same business can manage hours.
     */
    public function manageHours(User $user, Staff $staff): bool
    {
        return $user->hasRole('owner') && $user->business_id === $staff->business_id;
    }
}
