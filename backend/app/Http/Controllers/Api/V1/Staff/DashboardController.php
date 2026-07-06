<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        $staff = Staff::where('user_id', $user->id)->firstOrFail();
        $today = now('Africa/Cairo')->startOfDay();

        $todayBookings = Booking::where('staff_id', $staff->id)
            ->whereDate('starts_at', $today)
            ->where('status', 'confirmed')
            ->count();

        $monthBookings = Booking::where('staff_id', $staff->id)
            ->whereMonth('starts_at', now()->month)
            ->whereYear('starts_at', now()->year)
            ->where('status', '!=', 'cancelled')
            ->count();

        $noShowCount = Booking::where('staff_id', $staff->id)
            ->whereMonth('starts_at', now()->month)
            ->whereYear('starts_at', now()->year)
            ->where('status', 'no_show')
            ->count();

        $noShowRate = $monthBookings > 0 ? round(($noShowCount / $monthBookings) * 100, 1) : 0;

        return response()->json([
            'data' => [
                'today_bookings' => $todayBookings,
                'month_bookings' => $monthBookings,
                'no_show_rate' => $noShowRate,
            ],
        ]);
    }
}
