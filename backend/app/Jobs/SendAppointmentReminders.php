<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SendAppointmentReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job to send appointment reminders for tomorrow's bookings.
     *
     * @param  NotificationService  $notificationService  The notification service.
     */
    public function handle(NotificationService $notificationService): void
    {
        $tomorrow = now('Africa/Cairo')->addDay()->startOfDay();
        $tomorrowEnd = now('Africa/Cairo')->addDay()->endOfDay();

        $bookings = Booking::whereBetween('starts_at', [$tomorrow, $tomorrowEnd])
            ->where('status', 'confirmed')
            ->with('customer', 'service', 'branch')
            ->get();

        foreach ($bookings as $booking) {
            $notificationService->sendAppointmentReminder(
                $booking->customer,
                [
                    'booking_id' => $booking->id,
                    'barber' => $booking->branch->name,
                    'time' => $booking->starts_at->setTimezone('Africa/Cairo')->format('H:i'),
                    'customer_name' => $booking->customer->name,
                ]
            );
        }
    }
}
