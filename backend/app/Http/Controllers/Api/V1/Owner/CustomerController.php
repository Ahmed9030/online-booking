<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Resources\CustomerResource;
use App\Models\Booking;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

class CustomerController extends Controller
{
    /**
     * List all customers for the owner's business.
     * GET /api/v1/owner/customers
     */
    public function index(): ResourceCollection
    {
        $customers = Customer::where('business_id', auth()->user()->business_id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return CustomerResource::collection($customers);
    }

    /**
     * Get customer details.
     * GET /api/v1/owner/customers/{id}
     */
    public function show(string $id): JsonResponse
    {
        $customer = Customer::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        return response()->json(['data' => new CustomerResource($customer)]);
    }

    /**
     * Get customer's booking history.
     * GET /api/v1/owner/customers/{id}/bookings
     */
    public function bookings(string $id): ResourceCollection
    {
        $customer = Customer::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $bookings = Booking::where('customer_id', $customer->id)
            ->with(['service', 'staff', 'branch'])
            ->orderByDesc('starts_at')
            ->paginate(15);

        return BookingResource::collection($bookings);
    }
}
