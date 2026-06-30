<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Business;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Platform-wide analytics: revenue, user growth, booking stats, business metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $monthsBack = min((int) ($request->input('months', 12)), 36);

        return response()->json([
            'data' => [
                'revenue' => $this->getRevenueData($monthsBack),
                'users' => $this->getUserGrowthData($monthsBack),
                'bookings' => $this->getBookingStats($monthsBack),
                'businesses' => $this->getBusinessMetrics(),
            ],
        ]);
    }

    /**
     * Calculate revenue data from completed bookings.
     */
    private function getRevenueData(int $monthsBack): array
    {
        $totalRevenue = (float) Booking::withoutGlobalScopes()
            ->where('status', 'completed')
            ->join('services', 'bookings.service_id', '=', 'services.id')
            ->sum('services.price');

        $thisMonthRevenue = (float) Booking::withoutGlobalScopes()
            ->where('status', 'completed')
            ->whereMonth('bookings.created_at', now()->month)
            ->whereYear('bookings.created_at', now()->year)
            ->join('services', 'bookings.service_id', '=', 'services.id')
            ->sum('services.price');

        $monthlyRevenue = Booking::withoutGlobalScopes()
            ->where('status', 'completed')
            ->where('bookings.created_at', '>=', now()->subMonths($monthsBack))
            ->join('services', 'bookings.service_id', '=', 'services.id')
            ->select(
                DB::raw("DATE_TRUNC('month', bookings.created_at) as month"),
                DB::raw('SUM(services.price) as revenue')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => Carbon::parse($row->month)->format('Y-m'),
                'revenue' => (float) $row->revenue,
            ]);

        return [
            'total' => $totalRevenue,
            'this_month' => $thisMonthRevenue,
            'monthly' => $monthlyRevenue,
        ];
    }

    /**
     * Calculate user registration growth over time.
     */
    private function getUserGrowthData(int $monthsBack): array
    {
        $totalUsers = User::withoutGlobalScopes()->count();
        $newThisMonth = User::withoutGlobalScopes()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $monthlyGrowth = User::withoutGlobalScopes()
            ->where('created_at', '>=', now()->subMonths($monthsBack))
            ->select(
                DB::raw("DATE_TRUNC('month', created_at) as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => Carbon::parse($row->month)->format('Y-m'),
                'count' => (int) $row->count,
            ]);

        return [
            'total' => $totalUsers,
            'this_month' => $newThisMonth,
            'monthly' => $monthlyGrowth,
        ];
    }

    /**
     * Aggregate booking statistics.
     */
    private function getBookingStats(int $monthsBack): array
    {
        $totalBookings = Booking::withoutGlobalScopes()->count();

        $byStatus = Booking::withoutGlobalScopes()
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        $monthlyBookings = Booking::withoutGlobalScopes()
            ->where('created_at', '>=', now()->subMonths($monthsBack))
            ->select(
                DB::raw("DATE_TRUNC('month', created_at) as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => Carbon::parse($row->month)->format('Y-m'),
                'count' => (int) $row->count,
            ]);

        return [
            'total' => $totalBookings,
            'by_status' => $byStatus,
            'monthly' => $monthlyBookings,
        ];
    }

    /**
     * Aggregate business-level metrics.
     */
    private function getBusinessMetrics(): array
    {
        $total = Business::withoutGlobalScopes()->count();

        $bySubscription = Business::withoutGlobalScopes()
            ->select('subscription_status', DB::raw('COUNT(*) as count'))
            ->groupBy('subscription_status')
            ->get()
            ->pluck('count', 'subscription_status')
            ->toArray();

        return [
            'total' => $total,
            'by_subscription' => $bySubscription,
        ];
    }
}
