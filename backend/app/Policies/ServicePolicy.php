<?php

namespace App\Policies;

use App\Models\Service;
use App\Models\User;

class ServicePolicy
{
    /**
     * Determine if the user can create a service.
     * Only owners can create services.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('owner');
    }

    /**
     * Determine if the user can update the service.
     * Only owners of the same business can update.
     */
    public function update(User $user, Service $service): bool
    {
        return $user->hasRole('owner') && $user->business_id === $service->business_id;
    }

    /**
     * Determine if the user can delete the service.
     * Only owners of the same business can delete.
     */
    public function delete(User $user, Service $service): bool
    {
        return $user->hasRole('owner') && $user->business_id === $service->business_id;
    }
}
