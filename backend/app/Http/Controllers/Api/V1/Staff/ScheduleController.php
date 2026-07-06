<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Actions\Bookings\CancelBookingAction;
use App\Actions\Bookings\MarkBookingCompletedAction;
use App\Actions\Bookings\MarkBookingNoShowAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ScheduleController extends Controller
{
    /**
     * @param  MarkBookingCompletedAction  $markCompleted  Service to mark bookings as completed.
     * @param  MarkBookingNoShowAction     $markNoShow     Service to mark bookings as no-show.
     * @param  CancelBookingAction         $cancelBooking  Service to cancel bookings.
     */
    public function __construct(
        private readonly MarkBookingCompletedAction $markCompleted,
        private readonly MarkBookingNoShowAction $markNoShow,
        private readonly CancelBookingAction $cancelBooking,
    ) {}

    /**
     * View own schedule.
     * GET /api/v1/staff/schedule
     * Query params: date_from, date_to (optional date range, defaults to today)
     */
    public function index(Request $request): ResourceCollection
    {
        $validator = Validator::make($request->all(), [
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $user = auth()->user();
        $staff = Staff::where('user_id', $user->id)->firstOrFail();

        $query = Booking::where('staff_id', $staff->id)
            ->with(['customer', 'service', 'branch']);

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereDate('starts_at', '>=', Carbon::parse($request->input('date_from')))
                ->whereDate('starts_at', '<=', Carbon::parse($request->input('date_to')));
        } else {
            $query->whereDate('starts_at', now('Africa/Cairo')->toDateString());
        }

        $bookings = $query->orderBy('starts_at')->get();

        return BookingResource::collection($bookings);
    }

    /**
     * View schedule for a specific date.
     * GET /api/v1/staff/schedule/{date}
     */
    public function show(string $date): ResourceCollection
    {
        $validator = Validator::make(['date' => $date], [
            'date' => ['required', 'date'],
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

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
     * List all bookings for the staff member (paginated, filterable).
     * GET /api/v1/staff/bookings
     */
    public function listBookings(Request $request): ResourceCollection
    {
        $validator = Validator::make($request->all(), [
            'status' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $user = auth()->user();
        $staff = Staff::where('user_id', $user->id)->firstOrFail();

        $query = Booking::where('staff_id', $staff->id)
            ->with(['customer', 'service', 'branch']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('starts_at', '>=', Carbon::parse($request->input('date_from')));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('starts_at', '<=', Carbon::parse($request->input('date_to')));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);

        $bookings = $query->orderBy('starts_at', 'desc')->paginate($perPage);

        return BookingResource::collection($bookings);
    }

    /**
     * Cancel a booking.
     * PATCH /api/v1/staff/bookings/{id}/cancelled
     */
    public function markCancelled(string $id): JsonResponse
    {
        $user = auth()->user();
        $staff = Staff::where('user_id', $user->id)->firstOrFail();

        $booking = Booking::where('staff_id', $staff->id)->findOrFail($id);

        try {
            $this->cancelBooking->handle($booking->id);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => new BookingResource($booking->fresh())]);
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
