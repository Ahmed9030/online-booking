<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;

class BranchPolicy
{
    /**
     * Determine if the user can view the branch.
     * Any user belonging to the same business can view.
     */
    public function view(User $user, Branch $branch): bool
    {
        return $user->business_id === $branch->business_id;
    }

    /**
     * Determine if the user can update the branch.
     * Only owners of the same business can update.
     */
    public function update(User $user, Branch $branch): bool
    {
        return $user->business_id === $branch->business_id && $user->hasRole('owner');
    }

    /**
     * Determine if the user can delete the branch.
     * Only owners of the same business can delete.
     */
    public function delete(User $user, Branch $branch): bool
    {
        return $user->business_id === $branch->business_id && $user->hasRole('owner');
    }
}
