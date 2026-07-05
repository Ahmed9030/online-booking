<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SettingsController extends Controller
{
    /**
     * Get business settings / profile.
     * GET /api/v1/owner/settings
     */
    public function show(): JsonResponse
    {
        $business = auth()->user()->business;

        return response()->json(['data' => new BusinessResource($business)]);
    }

    /**
     * Update business settings / profile.
     * PATCH /api/v1/owner/settings
     */
    public function update(Request $request): JsonResponse
    {
        $business = auth()->user()->business;

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:3', 'max:100'],
            'logo_url' => ['nullable', 'url'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $business->update($validated);

        // Refresh the business data in the response
        $business->load('branches');

        return response()->json(['data' => new BusinessResource($business)]);
    }

    /**
     * Update the authenticated owner's account password.
     * PATCH /api/v1/owner/settings/password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'new_password' => ['required', 'string', Password::min(8)],
        ]);

        $user = auth()->user();
        $user->update(['password' => Hash::make($validated['new_password'])]);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
