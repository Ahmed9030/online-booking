<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Models\Branch;
use App\Models\Service;
use App\Models\Staff;
use App\Repositories\AvailabilityRepository;
use Carbon\Carbon;

final class AssignAvailableStaffAction
{
    /**
     * @param  AvailabilityRepository  $repository  Repository for checking staff conflicts.
     */
    public function __construct(private readonly AvailabilityRepository $repository) {}

    /**
     * Find the first available staff member for a given service at the requested time.
     * Returns null if all qualified staff have conflicting bookings.
     */
    public function handle(
        Branch $branch,
        Service $service,
        Carbon $startsAt,
        Carbon $endsAt,
    ): ?Staff {
        $qualifiedStaff = $service->staff()
            ->where('branch_id', $branch->id)
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        foreach ($qualifiedStaff as $staff) {
            $conflict = $this->repository->findConflictingBooking($staff->id, $startsAt, $endsAt);
            if (! $conflict) {
                return $staff;
            }
        }

        return null;
    }
}
