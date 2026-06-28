<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  Booking  $booking  The booking that was completed.
     */
    public function __construct(public readonly Booking $booking) {}
}
