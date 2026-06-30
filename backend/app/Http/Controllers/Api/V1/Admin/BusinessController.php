<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class BusinessController extends Controller
{
    /**
     * List all businesses on the platform.
     * GET /api/v1/admin/businesses
     */
    public function index(Request $request): ResourceCollection
    {
        $query = Business::withoutGlobalScopes()
            ->with('owner')
            ->withCount(['branches', 'staff', 'services', 'bookings'])
            ->orderByDesc('created_at');

        if ($request->filled('subscription_status')) {
            $query->where('subscription_status', $request->input('subscription_status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return BusinessResource::collection(
            $query->paginate(min((int) ($request->input('per_page', 15)), 100))
        );
    }

    /**
     * Get business details.
     * GET /api/v1/admin/businesses/{id}
     */
    public function show(string $id): JsonResponse
    {
        $business = Business::withoutGlobalScopes()
            ->with('owner')
            ->withCount(['branches', 'staff', 'services', 'bookings'])
            ->findOrFail($id);

        return response()->json(['data' => new BusinessResource($business)]);
    }

    /**
     * Update subscription for a business.
     * PATCH /api/v1/admin/businesses/{id}/subscription
     */
    public function updateSubscription(string $id, Request $request): JsonResponse
    {
        $business = Business::withoutGlobalScopes()->findOrFail($id);

        $validated = $request->validate([
            'subscription_status' => ['required', 'string', 'in:trial,active,expired,suspended'],
            'subscription_expires_at' => ['nullable', 'date'],
        ]);

        $business->update($validated);

        return response()->json([
            'data' => new BusinessResource($business),
            'message' => 'Subscription updated.',
        ]);
    }

    /**
     * Update business status (activate/suspend).
     * PATCH /api/v1/admin/businesses/{id}/status
     */
    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $business = Business::withoutGlobalScopes()->findOrFail($id);

        $request->validate([
            'subscription_status' => ['required', 'string', 'in:trial,active,expired,suspended'],
        ]);

        $business->update(['subscription_status' => $request->input('subscription_status')]);

        return response()->json([
            'data' => new BusinessResource($business),
            'message' => 'Business status updated.',
        ]);
    }
}
