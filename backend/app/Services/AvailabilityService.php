<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\SlotNotAvailableException;
use App\Models\Branch;
use App\Models\Service as ServiceModel;
use App\Models\Staff;
use App\Models\StaffWorkingHour;
use App\Repositories\AvailabilityRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection as SupportCollection;

final class AvailabilityService
{
    /**
     * @param  AvailabilityRepository  $repository  Repository for querying booking conflicts.
     */
    public function __construct(private readonly AvailabilityRepository $repository) {}

    /**
     * Get available time slots for a branch, service, optional staff, and date.
     *
     * @param  Branch  $branch  The branch to check availability for.
     * @param  ServiceModel  $service  The requested service.
     * @param  Staff|null  $staff  Specific staff member (null for any available).
     * @param  Carbon  $date  The target date.
     * @return SupportCollection<int, array{id: string, starts_at: Carbon, ends_at: Carbon, staff_id: string, staff_name: string}>
     */
    public function getAvailableSlots(
        Branch $branch,
        ServiceModel $service,
        ?Staff $staff,
        Carbon $date,
    ): SupportCollection {
        $date = $date->clone()->setTimezone('Africa/Cairo')->startOfDay();
        $weekday = $date->dayOfWeek;

        $branchHours = $branch->workingHours()->where('weekday', $weekday)->first();
        if (! $branchHours || ! $branchHours->open_time) {
            return collect([]);
        }

        if ($staff) {
            return $this->getSlotsForSpecificStaff($branch, $service, $staff, $date);
        }

        return $this->getSlotsForAnyAvailableStaff($branch, $service, $date);
    }

    /**
     * Assert that a time slot is not already booked for the given staff member.
     *
     * @throws SlotNotAvailableException If the slot conflicts with an existing booking.
     */
    public function assertSlotAvailable(string $staffId, Carbon $startsAt, Carbon $endsAt): void
    {
        $conflict = $this->repository->findConflictingBooking($staffId, $startsAt, $endsAt);
        if ($conflict) {
            throw new SlotNotAvailableException('This time slot is no longer available. Please choose a different time.');
        }
    }

    private function getSlotsForSpecificStaff(
        Branch $branch,
        ServiceModel $service,
        Staff $staff,
        Carbon $date,
    ): SupportCollection {
        // Check staff offers the service
        if (! $staff->services()->where('service_id', $service->id)->exists()) {
            return collect([]);
        }

        $weekday = $date->dayOfWeek;

        $staffHours = $staff->workingHours()->where('weekday', $weekday)->first();
        if (! $staffHours || ! $staffHours->start_time) {
            return collect([]);
        }

        $branchHours = $branch->workingHours()->where('weekday', $weekday)->first();
        if (! $branchHours || ! $branchHours->open_time) {
            return collect([]);
        }

        // Build Carbon datetimes in Cairo timezone
        $startOfDay = $date->clone()->setHour(0)->setMinute(0)->setSecond(0);

        $openDateTime = $startOfDay->clone()->setTimeFromTimeString($branchHours->open_time);
        $closeDateTime = $startOfDay->clone()->setTimeFromTimeString($branchHours->close_time);

        $staffStartDateTime = $startOfDay->clone()->setTimeFromTimeString($staffHours->start_time);
        $staffEndDateTime = $startOfDay->clone()->setTimeFromTimeString($staffHours->end_time);

        $workStart = $openDateTime->greaterThan($staffStartDateTime) ? $openDateTime : $staffStartDateTime;
        $workEnd = $closeDateTime->lessThan($staffEndDateTime) ? $closeDateTime : $staffEndDateTime;

        if ($workStart >= $workEnd) {
            return collect([]);
        }

        $bookedSlots = $this->repository->getConfirmedBookingsForStaffOnDate($staff->id, $date);

        // Normalize booked slots to Cairo timezone for comparison
        $bookedSlots = $bookedSlots->map(function ($b) {
            $b->starts_at = Carbon::parse($b->starts_at)->setTimezone('Africa/Cairo');
            $b->ends_at = Carbon::parse($b->ends_at)->setTimezone('Africa/Cairo');

            return $b;
        });

        $duration = (int) $service->duration_minutes;
        $slots = collect([]);

        $current = $workStart->clone();
        while ($current->clone()->addMinutes($duration) <= $workEnd) {
            $slotEnd = $current->clone()->addMinutes($duration);

            $isAvailable = ! $bookedSlots->contains(function ($booking) use ($current, $slotEnd) {
                return $current < $booking->ends_at && $slotEnd > $booking->starts_at;
            });

            if ($isAvailable) {
                $slots->push([
                    'id' => $staff->id.'_'.$current->format('H_i'),
                    'starts_at' => $current->clone(),
                    'ends_at' => $slotEnd->clone(),
                    'staff_id' => $staff->id,
                    'staff_name' => $staff->name,
                ]);
            }

            $current->addMinutes($duration);
        }

        return $slots;
    }

    private function getSlotsForAnyAvailableStaff(Branch $branch, ServiceModel $service, Carbon $date): SupportCollection
    {
        $qualifiedStaff = $service->staff()
            ->where('branch_id', $branch->id)
            ->orderBy('id')
            ->get();

        if ($qualifiedStaff->isEmpty()) {
            return collect([]);
        }

        $weekday = $date->dayOfWeek;
        $staffIds = $qualifiedStaff->pluck('id');

        $staffHours = StaffWorkingHour::whereIn('staff_id', $staffIds)
            ->where('weekday', $weekday)
            ->get()
            ->keyBy('staff_id');

        $branchHoursForDay = $branch->workingHours()->where('weekday', $weekday)->first();
        if (! $branchHoursForDay || ! $branchHoursForDay->open_time) {
            return collect([]);
        }

        $bookedSlotsByStaff = $this->repository->getConfirmedBookingsForStaffArray($staffIds->toArray(), $date)
            ->groupBy('staff_id');

        $startOfDay = $date->clone()->setHour(0)->setMinute(0)->setSecond(0);
        $openDateTime = $startOfDay->clone()->setTimeFromTimeString($branchHoursForDay->open_time);
        $closeDateTime = $startOfDay->clone()->setTimeFromTimeString($branchHoursForDay->close_time);

        $allSlots = collect([]);
        $duration = (int) $service->duration_minutes;

        foreach ($qualifiedStaff as $staff) {
            $sh = $staffHours->get($staff->id);
            if (! $sh || ! $sh->start_time) {
                continue;
            }

            $staffStart = $startOfDay->clone()->setTimeFromTimeString($sh->start_time);
            $staffEnd = $startOfDay->clone()->setTimeFromTimeString($sh->end_time);

            $workStart = $openDateTime->greaterThan($staffStart) ? $openDateTime : $staffStart;
            $workEnd = $closeDateTime->lessThan($staffEnd) ? $closeDateTime : $staffEnd;

            if ($workStart >= $workEnd) {
                continue;
            }

            $staffBookedSlots = ($bookedSlotsByStaff->get($staff->id) ?? collect([]))->map(function ($b) {
                $b->starts_at = Carbon::parse($b->starts_at)->setTimezone('Africa/Cairo');
                $b->ends_at = Carbon::parse($b->ends_at)->setTimezone('Africa/Cairo');

                return $b;
            });

            $current = $workStart->clone();
            while ($current->clone()->addMinutes($duration) <= $workEnd) {
                $slotEnd = $current->clone()->addMinutes($duration);

                $isAvailable = ! $staffBookedSlots->contains(function ($booking) use ($current, $slotEnd) {
                    return $current < $booking->ends_at && $slotEnd > $booking->starts_at;
                });

                if ($isAvailable) {
                    $allSlots->push([
                        'id' => $staff->id.'_'.$current->format('H_i'),
                        'starts_at' => $current->clone(),
                        'ends_at' => $slotEnd->clone(),
                        'staff_id' => $staff->id,
                        'staff_name' => $staff->name,
                    ]);
                }

                $current->addMinutes($duration);
            }
        }

        return $allSlots->unique(function ($item) {
            return $item['starts_at']->format('H:i');
        })->sortBy('starts_at')->values();
    }
}
