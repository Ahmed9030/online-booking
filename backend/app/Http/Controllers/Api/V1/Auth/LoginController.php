<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    /**
     * Login owner or staff (password-based).
     * POST /api/v1/auth/login
     *
     * Request body:
     * {
     *   "email_or_username": "owner@example.com or barber_ahmed",
     *   "password": "secret"
     * }
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $user = \App\Models\User::where(function ($q) use ($request) {
            $q->where('email', $request->validated('email_or_username'))
              ->orWhere('username', $request->validated('email_or_username'));
        })->first();

        if (!$user || !Hash::check($request->validated('password'), $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'This account has been deactivated.',
            ], 403);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'user'  => new UserResource($user),
                'token' => $token,
            ],
            'message' => 'Logged in successfully.',
        ]);
    }

    /**
     * Logout (authenticated).
     * POST /api/v1/auth/logout
     */
    public function destroy(): JsonResponse
    {
        auth()->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
