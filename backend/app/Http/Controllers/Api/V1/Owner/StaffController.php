<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\StaffResource;
use App\Models\Staff;
use App\Models\StaffWorkingHour;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    /**
     * List all staff for the owner's business.
     * GET /api/v1/owner/staff
     */
    public function index(): ResourceCollection
    {
        $staff = Staff::where('business_id', auth()->user()->business_id)
            ->with(['services', 'workingHours'])
            ->orderBy('name')
            ->paginate(15);

        return StaffResource::collection($staff);
    }

    /**
     * Create a new staff member.
     * POST /api/v1/owner/staff
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'branch_id' => ['required', 'uuid', Rule::exists('branches', 'id')->where('business_id', auth()->user()->business_id)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $staff = Staff::create([
            'business_id' => auth()->user()->business_id,
            'branch_id' => $validated['branch_id'],
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['data' => new StaffResource($staff)], 201);
    }

    /**
     * Get staff details.
     * GET /api/v1/owner/staff/{id}
     */
    public function show(string $id): JsonResponse
    {
        $staff = Staff::where('business_id', auth()->user()->business_id)
            ->with(['services', 'workingHours'])
            ->findOrFail($id);

        return response()->json(['data' => new StaffResource($staff)]);
    }

    /**
     * Update staff member.
     * PATCH /api/v1/owner/staff/{id}
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $staff = Staff::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:100'],
            'branch_id' => ['sometimes', 'uuid', Rule::exists('branches', 'id')->where('business_id', auth()->user()->business_id)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $staff->update($validated);

        return response()->json(['data' => new StaffResource($staff)]);
    }

    /**
     * Delete staff member (soft delete).
     * DELETE /api/v1/owner/staff/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $staff = Staff::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $staff->delete();

        return response()->json(['message' => 'Staff member deleted.']);
    }

    /**
     * Update staff working hours.
     * POST /api/v1/owner/staff/{id}/working-hours
     */
    public function updateWorkingHours(string $id, Request $request): JsonResponse
    {
        $staff = Staff::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'working_hours' => ['required', 'array', 'min:1'],
            'working_hours.*.weekday' => ['required', 'integer', 'between:0,6'],
            'working_hours.*.start_time' => ['nullable', 'date_format:H:i'],
            'working_hours.*.end_time' => ['nullable', 'date_format:H:i'],
        ]);

        $staff->workingHours()->delete();

        foreach ($validated['working_hours'] as $hours) {
            StaffWorkingHour::create([
                'staff_id' => $staff->id,
                'weekday' => $hours['weekday'],
                'start_time' => $hours['start_time'] ?? null,
                'end_time' => $hours['end_time'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Working hours updated.']);
    }

    /**
     * Assign services to a staff member.
     * POST /api/v1/owner/staff/{id}/services
     */
    public function assignServices(string $id, Request $request): JsonResponse
    {
        $staff = Staff::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'service_ids' => ['required', 'array'],
            'service_ids.*' => ['uuid', Rule::exists('services', 'id')->where('business_id', auth()->user()->business_id)->where('branch_id', $staff->branch_id)],
        ]);

        $staff->services()->sync($validated['service_ids']);

        return response()->json(['message' => 'Services assigned.']);
    }

    /**
     * Create login credentials for a staff member.
     * POST /api/v1/owner/staff/{id}/login-credentials
     */
    public function createLoginCredentials(string $id, Request $request): JsonResponse
    {
        $staff = Staff::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        // Create or update user account for this staff member
        $user = User::updateOrCreate(
            ['id' => $staff->user_id],
            [
                'name' => $staff->name,
                'username' => $validated['username'],
                'password' => Hash::make($validated['password']),
                'role' => UserRole::Staff,
                'business_id' => $staff->business_id,
                'is_active' => true,
            ],
        );

        $staff->update(['user_id' => $user->id]);

        return response()->json(['message' => 'Login credentials created.']);
    }
}
