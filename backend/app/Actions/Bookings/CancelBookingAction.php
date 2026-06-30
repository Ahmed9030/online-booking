<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Events\BookingCancelled;
use App\Models\Booking;

final class CancelBookingAction
{
    /**
     * Cancel a booking if it is not already completed or cancelled.
     * Fires the BookingCancelled event after a successful cancellation.
     *
     * @throws \InvalidArgumentException If the booking is already completed or cancelled.
     */
    public function handle(string $bookingId): Booking
    {
        $booking = Booking::findOrFail($bookingId);

        if (in_array($booking->status, [BookingStatus::Completed, BookingStatus::Cancelled], true)) {
            throw new \InvalidArgumentException('Cannot cancel a booking that is already completed or cancelled.');
        }

        $booking->update(['status' => BookingStatus::Cancelled]);

        event(new BookingCancelled($booking));

        return $booking;
    }
}
