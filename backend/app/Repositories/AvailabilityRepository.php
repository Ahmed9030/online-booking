<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

final class AvailabilityRepository
{
    /**
     * Get confirmed bookings for a staff member on a specific date.
     *
     * @return Collection<int, Booking>
     */
    public function getConfirmedBookingsForStaffOnDate(string $staffId, Carbon $date): Collection
    {
        return Booking::where('staff_id', $staffId)
            ->where('status', BookingStatus::Confirmed)
            ->whereDate('starts_at', $date->toDateString())
            ->orderBy('starts_at')
            ->get(['id', 'starts_at', 'ends_at']);
    }

    /**
     * Find a single conflicting confirmed booking for the given interval.
     */
    public function findConflictingBooking(string $staffId, Carbon $startsAt, Carbon $endsAt): ?Booking
    {
        return Booking::where('staff_id', $staffId)
            ->where('status', BookingStatus::Confirmed)
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->first();
    }
}
