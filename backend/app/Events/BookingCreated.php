<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class BookingCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  Booking  $booking  The booking that was created.
     */
    public function __construct(public readonly Booking $booking) {}
}
