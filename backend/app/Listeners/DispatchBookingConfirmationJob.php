<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Jobs\SendBookingConfirmationWebhook;

final class DispatchBookingConfirmationJob
{
    /**
     * Dispatch the booking confirmation webhook job on the notifications queue.
     */
    public function handle(BookingCreated $event): void
    {
        dispatch(new SendBookingConfirmationWebhook($event->booking))
            ->onQueue('notifications');
    }
}
