<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\BookingCompleted;

final class UpdateCustomerVisitStats
{
    /**
     * Handle the BookingCompleted event.
     * Increments customer visit count and updates last visit timestamp.
     */
    public function handle(BookingCompleted $event): void
    {
        $booking = $event->booking;
        $customer = $booking->customer;

        // Increment visit count
        $customer->increment('visit_count');

        // Update last visit time (in Cairo timezone)
        $customer->update([
            'last_visit_at' => now('Africa/Cairo'),
        ]);
    }
}
