<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Actions\Bookings\CancelBookingAction;
use App\Actions\Bookings\CreateBookingAction;
use App\Data\CreateBookingData;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class BookingController extends Controller
{
    public function __construct(
        private readonly CreateBookingAction $createBooking,
        private readonly CancelBookingAction $cancelBooking,
    ) {}

    /**
     * List all bookings for the owner's business.
     * GET /api/v1/owner/bookings
     */
    public function index(Request $request): ResourceCollection
    {
        $business = auth()->user()->business;

        $bookings = Booking::where('business_id', $business->id)
            ->with(['customer', 'service', 'staff', 'branch'])
            ->when($request->query('branch_id'), fn ($q, $v) => $q->where('branch_id', $v))
            ->when($request->query('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->query('date'), fn ($q, $v) => $q->whereDate('starts_at', $v))
            ->orderByDesc('starts_at')
            ->paginate(15);

        return BookingResource::collection($bookings);
    }

    /**
     * Create a manual booking (owner creates on behalf of customer).
     * POST /api/v1/owner/bookings
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id'      => ['required', 'uuid', 'exists:branches,id'],
            'service_id'     => ['required', 'uuid', 'exists:services,id'],
            'staff_id'       => ['nullable', 'uuid', 'exists:staff,id'],
            'customer_name'  => ['required', 'string', 'min:2', 'max:100'],
            'customer_phone' => ['required', 'string'],
            'starts_at'      => ['required', 'date', 'after:now'],
            'ends_at'        => ['required', 'date', 'after:starts_at'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ]);

        $business = auth()->user()->business;

        $customer = Customer::firstOrCreate(
            ['business_id' => $business->id, 'phone' => $validated['customer_phone']],
            ['name' => $validated['customer_name']],
        );

        $data = new CreateBookingData(
            businessId: $business->id,
            branchId: $validated['branch_id'],
            serviceId: $validated['service_id'],
            customerId: $customer->id,
            startsAt: Carbon::parse($validated['starts_at'])->setTimezone('Africa/Cairo'),
            endsAt: Carbon::parse($validated['ends_at'])->setTimezone('Africa/Cairo'),
            staffId: $validated['staff_id'] ?? null,
            source: 'manual',
        );

        $booking = $this->createBooking->handle($data);

        return response()->json(['data' => new BookingResource($booking)], 201);
    }

    /**
     * Get booking details.
     * GET /api/v1/owner/bookings/{id}
     */
    public function show(string $id): JsonResponse
    {
        $business = auth()->user()->business;

        $booking = Booking::where('business_id', $business->id)
            ->with(['customer', 'service', 'staff', 'branch'])
            ->findOrFail($id);

        return response()->json(['data' => new BookingResource($booking)]);
    }

    /**
     * Update booking status.
     * PATCH /api/v1/owner/bookings/{id}/status
     */
    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $business = auth()->user()->business;

        $booking = Booking::where('business_id', $business->id)
            ->findOrFail($id);

        $request->validate([
            'status' => ['required', 'string', 'in:confirmed,cancelled,completed,no_show'],
        ]);

        if ($request->input('status') === 'cancelled') {
            $this->cancelBooking->handle($booking);
        } else {
            $booking->update(['status' => $request->input('status')]);
        }

        return response()->json(['data' => new BookingResource($booking->fresh())]);
    }

    /**
     * Delete booking (soft delete).
     * DELETE /api/v1/owner/bookings/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $business = auth()->user()->business;

        $booking = Booking::where('business_id', $business->id)
            ->findOrFail($id);

        $booking->delete();

        return response()->json(['message' => 'Booking deleted.']);
    }
}
