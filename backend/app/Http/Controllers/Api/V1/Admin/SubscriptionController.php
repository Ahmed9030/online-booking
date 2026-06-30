<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class SubscriptionController extends Controller
{
    /**
     * List all subscriptions across the platform (paginated).
     */
    public function index(Request $request): ResourceCollection
    {
        $query = Business::withoutGlobalScopes()
            ->with('owner')
            ->withCount(['branches', 'staff', 'bookings'])
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
     * Get a single subscription's details.
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
     * Renew a business subscription by setting status to active and updating expiry date.
     */
    public function renew(string $id, Request $request): JsonResponse
    {
        $business = Business::withoutGlobalScopes()->findOrFail($id);

        $validated = $request->validate([
            'expires_at' => ['required', 'date', 'after:today'],
        ]);

        $business->update([
            'subscription_status' => SubscriptionStatus::Active,
            'subscription_expires_at' => Carbon::parse($validated['expires_at']),
        ]);

        return response()->json([
            'data' => new BusinessResource($business),
            'message' => 'Subscription renewed successfully.',
        ]);
    }

    /**
     * List subscriptions that are expiring within the given number of days (default 7).
     */
    public function expiring(Request $request): ResourceCollection
    {
        $days = min((int) ($request->input('days', 7)), 90);

        $businesses = Business::withoutGlobalScopes()
            ->with('owner')
            ->whereIn('subscription_status', [SubscriptionStatus::Active, SubscriptionStatus::Trial])
            ->whereNotNull('subscription_expires_at')
            ->whereBetween('subscription_expires_at', [
                Carbon::today(),
                Carbon::today()->addDays($days),
            ])
            ->orderBy('subscription_expires_at')
            ->paginate(min((int) ($request->input('per_page', 15)), 100));

        return BusinessResource::collection($businesses);
    }
}
