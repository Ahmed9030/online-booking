<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get dashboard overview stats.
     * GET /api/v1/owner/dashboard
     */
    public function index(): JsonResponse
    {
        $business = auth()->user()->business;
        $today = now('Africa/Cairo')->startOfDay();

        // Today's bookings
        $todayBookings = Booking::where('business_id', $business->id)
            ->whereDate('starts_at', $today)
            ->where('status', 'confirmed')
            ->count();

        // This month's bookings
        $monthBookings = Booking::where('business_id', $business->id)
            ->whereMonth('starts_at', now()->month)
            ->where('status', '!=', 'cancelled')
            ->count();

        // No-show rate this month
        $noShowCount = Booking::where('business_id', $business->id)
            ->whereMonth('starts_at', now()->month)
            ->where('status', 'no_show')
            ->count();

        $noShowRate = $monthBookings > 0 ? round(($noShowCount / $monthBookings) * 100, 1) : 0;

        // Next upcoming booking
        $nextBooking = Booking::where('business_id', $business->id)
            ->where('status', 'confirmed')
            ->where('starts_at', '>', now())
            ->orderBy('starts_at')
            ->first();

        // Subscription status
        $daysUntilExpiry = $business->subscription_expires_at?->diffInDays(now(), false) ?? 0;

        return response()->json([
            'data' => [
                'today_bookings' => $todayBookings,
                'month_bookings' => $monthBookings,
                'no_show_rate' => $noShowRate,
                'next_booking' => $nextBooking ? [
                    'id' => $nextBooking->id,
                    'customer_name' => $nextBooking->customer->name,
                    'starts_at' => $nextBooking->starts_at->setTimezone('Africa/Cairo'),
                    'service_name' => $nextBooking->service->name,
                ] : null,
                'subscription' => [
                    'status' => $business->subscription_status->value,
                    'expires_at' => $business->subscription_expires_at,
                    'days_remaining' => max(0, $daysUntilExpiry),
                ],
            ],
        ]);
    }
}
