<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    /**
     * List all services for the owner's business.
     * GET /api/v1/owner/services
     */
    public function index(): ResourceCollection
    {
        $services = Service::where('business_id', auth()->user()->business_id)
            ->orderBy('name')
            ->paginate(15);

        return ServiceResource::collection($services);
    }

    /**
     * Create a new service.
     * POST /api/v1/owner/services
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'price' => ['required', 'numeric', 'min:0'],
            'branch_id' => ['required', 'uuid', Rule::exists('branches', 'id')->where('business_id', auth()->user()->business_id)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service = Service::create([
            'business_id' => auth()->user()->business_id,
            'branch_id' => $validated['branch_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'duration_minutes' => $validated['duration_minutes'],
            'price' => $validated['price'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['data' => new ServiceResource($service)], 201);
    }

    /**
     * Get service details.
     * GET /api/v1/owner/services/{id}
     */
    public function show(string $id): JsonResponse
    {
        $service = Service::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        return response()->json(['data' => new ServiceResource($service)]);
    }

    /**
     * Update service.
     * PATCH /api/v1/owner/services/{id}
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $service = Service::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'duration_minutes' => ['sometimes', 'integer', 'min:5', 'max:480'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service->update($validated);

        return response()->json(['data' => new ServiceResource($service)]);
    }

    /**
     * Delete service (soft delete).
     * DELETE /api/v1/owner/services/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $service = Service::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }
}
