<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\BookingConfirmed;
use App\Services\NotificationService;

class SendBookingConfirmationNotification
{
    /**
     * @param  NotificationService  $notificationService  The notification service.
     */
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Handle the BookingConfirmed event.
     *
     * @param  BookingConfirmed  $event  The event instance.
     */
    public function handle(BookingConfirmed $event): void
    {
        $booking = $event->booking;

        $this->notificationService->sendBookingConfirmation(
            $booking->customer,
            [
                'booking_id' => $booking->id,
                'barber' => $booking->branch->name,
                'time' => $booking->starts_at->setTimezone('Africa/Cairo')->format('Y-m-d H:i'),
                'price' => $booking->service->price,
                'service_name' => $booking->service->name,
                'customer_name' => $booking->customer->name,
            ]
        );
    }
}
