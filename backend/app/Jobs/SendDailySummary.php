<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Booking;
use App\Models\Business;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SendDailySummary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job to send daily summary notifications to all business owners.
     *
     * @param  NotificationService  $notificationService  The notification service.
     */
    public function handle(NotificationService $notificationService): void
    {
        $today = now('Africa/Cairo')->startOfDay();
        $todayEnd = now('Africa/Cairo')->endOfDay();

        $businesses = Business::where('subscription_status', 'active')->get();

        foreach ($businesses as $business) {
            $bookings = Booking::with('service', 'staff')
                ->where('business_id', $business->id)
                ->whereBetween('created_at', [$today, $todayEnd])
                ->get();

            $completedBookings = $bookings->where('status', 'completed')->count();
            $totalBookings = $bookings->count();
            $revenue = $bookings->where('status', 'completed')
                ->sum(fn ($b) => $b->service->price);

            $topStaff = $bookings->where('status', 'completed')
                ->groupBy('staff_id')
                ->map(fn ($group, $staffId) => [
                    'id' => $staffId,
                    'name' => $group->first()->staff?->name ?? '',
                    'bookings' => $group->count(),
                ])
                ->sortByDesc('bookings')
                ->take(3)
                ->values()
                ->toArray();

            $owner = $business->owner;
            if ($owner) {
                $notificationService->sendDailySummary($owner, [
                    'total_bookings' => $totalBookings,
                    'completed_bookings' => $completedBookings,
                    'revenue' => $revenue,
                    'top_staff' => $topStaff,
                ]);
            }
        }
    }
}
