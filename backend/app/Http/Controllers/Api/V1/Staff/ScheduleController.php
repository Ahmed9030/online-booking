<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Actions\Bookings\MarkBookingCompletedAction;
use App\Actions\Bookings\MarkBookingNoShowAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ScheduleController extends Controller
{
    public function __construct(
        private readonly MarkBookingCompletedAction $markCompleted,
        private readonly MarkBookingNoShowAction $markNoShow,
    ) {}

    /**
     * View own schedule (today and upcoming).
     * GET /api/v1/staff/schedule
     */
    public function index(): ResourceCollection
    {
        $user = auth()->user();
        $staff = Staff::where('user_id', $user->id)->firstOrFail();

        $bookings = Booking::where('staff_id', $staff->id)
            ->with(['customer', 'service', 'branch'])
            ->whereDate('starts_at', now('Africa/Cairo')->toDateString())
            ->orderBy('starts_at')
            ->get();

        return BookingResource::collection($bookings);
    }

    /**
     * View schedule for a specific date.
     * GET /api/v1/staff/schedule/{date}
     */
    public function show(string $date): ResourceCollection
    {
        $user = auth()->user();
        $staff = Staff::where('user_id', $user->id)->firstOrFail();

        $bookings = Booking::where('staff_id', $staff->id)
            ->with(['customer', 'service', 'branch'])
            ->whereDate('starts_at', Carbon::parse($date)->toDateString())
            ->orderBy('starts_at')
            ->get();

        return BookingResource::collection($bookings);
    }

    /**
     * Mark a booking as completed.
     * PATCH /api/v1/staff/bookings/{id}/completed
     */
    public function markCompleted(string $id): JsonResponse
    {
        $user = auth()->user();
        $staff = Staff::where('user_id', $user->id)->firstOrFail();

        $booking = Booking::where('staff_id', $staff->id)->findOrFail($id);

        $this->markCompleted->handle($booking);

        return response()->json(['data' => new BookingResource($booking->fresh())]);
    }

    /**
     * Mark a booking as no-show.
     * PATCH /api/v1/staff/bookings/{id}/no-show
     */
    public function markNoShow(string $id): JsonResponse
    {
        $user = auth()->user();
        $staff = Staff::where('user_id', $user->id)->firstOrFail();

        $booking = Booking::where('staff_id', $staff->id)->findOrFail($id);

        $this->markNoShow->handle($booking);

        return response()->json(['data' => new BookingResource($booking->fresh())]);
    }
}
