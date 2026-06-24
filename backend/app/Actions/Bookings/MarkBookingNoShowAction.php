<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;

final class MarkBookingNoShowAction
{
    public function handle(string $bookingId): Booking
    {
        return DB::transaction(function () use ($bookingId) {
            $booking = Booking::lockForUpdate()->findOrFail($bookingId);

            if ($booking->status !== BookingStatus::Confirmed) {
                throw new \InvalidArgumentException('Only confirmed bookings can be marked as no-show.');
            }

            $booking->update(['status' => BookingStatus::NoShow]);

            return $booking;
        });
    }
}
