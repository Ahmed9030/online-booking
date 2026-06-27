<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            'name'        => ['sometimes', 'string', 'min:3', 'max:100'],
            'logo_url'    => ['nullable', 'url'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $business->update($validated);

        return response()->json(['data' => new BusinessResource($business)]);
    }
}
