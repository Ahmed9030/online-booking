<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use Illuminate\Http\Resources\Json\ResourceCollection;

class DueRemindersController extends Controller
{
    /**
     * Return bookings that are due for a reminder notification.
     * n8n polls this every 15 minutes.
     * GET /api/v1/internal/bookings/due-reminders
     *
     * Returns confirmed bookings starting in the next 60–75 minutes
     * that have not yet had a reminder sent.
     */
    public function index(): ResourceCollection
    {
        $now        = now('Africa/Cairo');
        $windowFrom = $now->copy()->addMinutes(60);
        $windowTo   = $now->copy()->addMinutes(75);

        $bookings = Booking::withoutGlobalScopes()
            ->with(['customer', 'service', 'staff', 'branch'])
            ->where('status', 'confirmed')
            ->whereBetween('starts_at', [$windowFrom, $windowTo])
            // Exclude bookings that already have a reminder sent
            ->whereDoesntHave('notificationLogs', function ($q) {
                $q->where('type', 'reminder')->where('status', 'sent');
            })
            ->get();

        return BookingResource::collection($bookings);
    }
}
