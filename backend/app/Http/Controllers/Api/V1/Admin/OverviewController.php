<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;

class OverviewController extends Controller
{
    /**
     * Platform-wide overview stats for admin.
     * GET /api/v1/admin/overview
     */
    public function index(): JsonResponse
    {
        $totalBusinesses = Business::withoutGlobalScopes()->count();
        $activeBusinesses = Business::withoutGlobalScopes()
            ->where('subscription_status', 'active')
            ->count();
        $trialBusinesses = Business::withoutGlobalScopes()
            ->where('subscription_status', 'trial')
            ->count();
        $totalCustomers = Customer::withoutGlobalScopes()->count();
        $totalBookings = Booking::withoutGlobalScopes()->count();
        $monthBookings = Booking::withoutGlobalScopes()
            ->whereMonth('created_at', now()->month)
            ->count();

        return response()->json([
            'data' => [
                'businesses' => [
                    'total' => $totalBusinesses,
                    'active' => $activeBusinesses,
                    'trial' => $trialBusinesses,
                ],
                'customers' => $totalCustomers,
                'bookings_total' => $totalBookings,
                'bookings_month' => $monthBookings,
            ],
        ]);
    }
}
