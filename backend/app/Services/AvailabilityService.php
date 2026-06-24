<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Branch;
use App\Models\Service as ServiceModel;
use App\Models\Staff;
use App\Repositories\AvailabilityRepository;
use App\Exceptions\SlotNotAvailableException;
use Carbon\Carbon;
use Illuminate\Support\Collection as SupportCollection;

final class AvailabilityService
{
    public function __construct(private readonly AvailabilityRepository $repository) {}

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

        [$openHour, $openMinute] = explode(':', $branchHours->open_time);
        [$branchCloseHour, $branchCloseMinute] = explode(':', $branchHours->close_time);

        [$staffStartHour, $staffStartMinute] = explode(':', $staffHours->start_time);
        [$staffEndHour, $staffEndMinute] = explode(':', $staffHours->end_time);

        $openDateTime = $startOfDay->clone()->setHour((int) $openHour)->setMinute((int) $openMinute);
        $closeDateTime = $startOfDay->clone()->setHour((int) $branchCloseHour)->setMinute((int) $branchCloseMinute);

        $staffStartDateTime = $startOfDay->clone()->setHour((int) $staffStartHour)->setMinute((int) $staffStartMinute);
        $staffEndDateTime = $startOfDay->clone()->setHour((int) $staffEndHour)->setMinute((int) $staffEndMinute);

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
                    'id' => $staff->id . '_' . $current->format('H_i'),
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

        foreach ($qualifiedStaff as $staff) {
            $slots = $this->getSlotsForSpecificStaff($branch, $service, $staff, $date);
            if ($slots->isNotEmpty()) {
                return $slots;
            }
        }

        return collect([]);
    }
}
