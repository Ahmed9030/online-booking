<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:50', 'unique:users,username,' . $user->id],
        ]);

        $user->update(['username' => $validated['username']]);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Username updated successfully.',
        ]);
    }

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
