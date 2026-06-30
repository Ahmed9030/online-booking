<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Customer;

use App\Actions\Bookings\CancelBookingAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

class MyBookingsController extends Controller
{
    /**
     * @param  CancelBookingAction  $cancelBooking  Service to cancel bookings.
     */
    public function __construct(
        private readonly CancelBookingAction $cancelBooking,
    ) {}

    private function customerIds(): array
    {
        return auth()->user()->customers()->pluck('id')->toArray();
    }

    /**
     * List own bookings.
     * GET /api/v1/customer/my-bookings
     */
    public function index(): ResourceCollection
    {
        $bookings = Booking::whereIn('customer_id', $this->customerIds())
            ->with(['service', 'staff', 'branch'])
            ->orderByDesc('starts_at')
            ->paginate(15);

        return BookingResource::collection($bookings);
    }

    /**
     * Get a specific booking.
     * GET /api/v1/customer/my-bookings/{id}
     */
    public function show(string $id): JsonResponse
    {
        $booking = Booking::whereIn('customer_id', $this->customerIds())
            ->with(['service', 'staff', 'branch'])
            ->findOrFail($id);

        return response()->json(['data' => new BookingResource($booking)]);
    }

    /**
     * Cancel a booking.
     * DELETE /api/v1/customer/my-bookings/{id}
     */
    public function cancel(string $id): JsonResponse
    {
        $booking = Booking::whereIn('customer_id', $this->customerIds())->findOrFail($id);

        // Customers can only cancel future bookings
        if ($booking->starts_at->isPast()) {
            return response()->json(['message' => 'Cannot cancel a past booking.'], 422);
        }

        try {
            $this->cancelBooking->handle($booking->id);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Booking cancelled.']);
    }
}
