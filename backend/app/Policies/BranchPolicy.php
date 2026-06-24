<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;

class BranchPolicy
{
    public function view(User $user, Branch $branch): bool
    {
        return $user->business_id === $branch->business_id;
    }

    public function update(User $user, Branch $branch): bool
    {
        return $user->business_id === $branch->business_id && $user->hasRole('owner');
    }

    public function delete(User $user, Branch $branch): bool
    {
        return $user->business_id === $branch->business_id && $user->hasRole('owner');
    }
}
