<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Events\BookingCompleted;
use Illuminate\Support\Facades\DB;

final class MarkBookingCompletedAction
{
    public function handle(string $bookingId): Booking
    {
        return DB::transaction(function () use ($bookingId) {
            $booking = Booking::lockForUpdate()->findOrFail($bookingId);

            if ($booking->status !== BookingStatus::Confirmed) {
                throw new \InvalidArgumentException('Only confirmed bookings can be marked as completed.');
            }

            $booking->update(['status' => BookingStatus::Completed]);

            // Fire BookingCompleted event — listener will update customer stats
            event(new BookingCompleted($booking));

            return $booking;
        });
    }
}
