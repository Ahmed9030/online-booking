<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\StoreBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use App\Http\Requests\Branch\UpdateWorkingHoursRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\BranchResource;
use App\Models\Branch;
use App\Models\BranchWorkingHour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class BranchController extends Controller
{
    /**
     * List all branches for the owner's business.
     * GET /api/v1/owner/branches
     */
    public function index(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->input('per_page', 15), 100));

        $branches = Branch::with('workingHours')
            ->where('business_id', auth()->user()->business_id)
            ->orderBy('created_at')
            ->paginate($perPage);

        return BranchResource::collection($branches);
    }

    /**
     * Create a new branch.
     * POST /api/v1/owner/branches
     */
    public function store(StoreBranchRequest $request): JsonResponse
    {
        $branch = Branch::create([
            'business_id' => auth()->user()->business_id,
            'name' => $request->validated('name'),
            'address' => $request->validated('address'),
            'city' => $request->validated('city'),
            'whatsapp_number' => $request->validated('whatsapp_number'),
            'slug' => $request->validated('slug'),
            'is_active' => true,
        ]);

        return response()->json(['data' => new BranchResource($branch)], 201);
    }

    /**
     * Get branch details.
     * GET /api/v1/owner/branches/{id}
     */
    public function show(string $id): JsonResponse
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->with('workingHours')
            ->findOrFail($id);

        return response()->json(['data' => new BranchResource($branch)]);
    }

    /**
     * Update branch.
     * PATCH /api/v1/owner/branches/{id}
     */
    public function update(string $id, UpdateBranchRequest $request): JsonResponse
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $branch->update($request->validated());

        return response()->json(['data' => new BranchResource($branch)]);
    }

    /**
     * Delete branch (soft delete).
     * DELETE /api/v1/owner/branches/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $branch->delete();

        return response()->json(['message' => 'Branch deleted.']);
    }

    /**
     * Update branch working hours.
     * POST /api/v1/owner/branches/{id}/working-hours
     *
     * Request body:
     * {
     *   "working_hours": [
     *     {"weekday": 0, "open_time": "09:00", "close_time": "18:00"},
     *     ...
     *   ]
     * }
     */
    public function updateWorkingHours(string $id, UpdateWorkingHoursRequest $request): JsonResponse
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        // Clear existing hours
        $branch->workingHours()->delete();

        // Create new hours
        foreach ($request->validated('working_hours') as $hours) {
            BranchWorkingHour::create([
                'branch_id' => $branch->id,
                'weekday' => $hours['weekday'],
                'open_time' => $hours['open_time'] ?? null,
                'close_time' => $hours['close_time'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Working hours updated.']);
    }

    /**
     * Get bookings for a branch.
     * GET /api/v1/owner/branches/{id}/bookings
     */
    public function bookings(string $id, Request $request): ResourceCollection
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));

        $bookings = $branch->bookings()
            ->orderByDesc('starts_at')
            ->paginate($perPage);

        return BookingResource::collection($bookings);
    }
}
