<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Actions\Bookings\CreateBookingAction;
use App\Data\CreateBookingData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StorePublicBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    /**
     * @param  CreateBookingAction  $createBooking  Service to create bookings.
     */
    public function __construct(
        private readonly CreateBookingAction $createBooking,
    ) {}

    /**
     * Create a booking (public flow, no auth required).
     * POST /api/v1/public/bookings
     *
     * Request body:
     * {
     *   "branch_id": "uuid",
     *   "service_id": "uuid",
     *   "staff_id": "uuid (optional, null for any available)",
     *   "customer_name": "Ahmed",
     *   "customer_phone": "+201001111111",
     *   "starts_at": "2026-06-25 14:00",
     *   "ends_at": "2026-06-25 14:30"
     * }
     */
    public function store(StorePublicBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Get or create customer
        $business = auth()->user()?->business ?? Branch::findOrFail($validated['branch_id'])->business;

        $customer = Customer::firstOrCreate(
            ['business_id' => $business->id, 'phone' => $validated['customer_phone']],
            ['name' => $validated['customer_name'], 'otp_verified_at' => now()],
        );

        if ($customer->user_id === null) {
            $user = User::where('phone', $customer->phone)->where('role', 'customer')->first();
            if ($user !== null) {
                $customer->user()->associate($user);
                $customer->saveQuietly();
            }
        }

        // Create booking via action
        $startsAt = Carbon::parse($validated['starts_at'])->setTimezone('Africa/Cairo');
        $endsAt = Carbon::parse($validated['ends_at'])->setTimezone('Africa/Cairo');

        $data = new CreateBookingData(
            businessId: $business->id,
            branchId: $validated['branch_id'],
            serviceId: $validated['service_id'],
            customerId: $customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $validated['staff_id'] ?? null,
            source: 'online',
        );

        $booking = $this->createBooking->handle($data);

        return response()->json(
            ['data' => new BookingResource($booking)],
            201,
        );
    }
}
