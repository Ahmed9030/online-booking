<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class BookingConfirmed
{
    use Dispatchable, SerializesModels;

    /**
     * @param  Booking  $booking  The booking that was confirmed.
     */
    public function __construct(public readonly Booking $booking) {}
}
