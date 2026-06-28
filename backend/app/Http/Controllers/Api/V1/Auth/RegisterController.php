<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegisterController extends Controller
{
    /**
     * Register a new business owner.
     * POST /api/v1/auth/register
     *
     * Request body:
     * {
     *   "name": "Ahmed's Barbershop",
     *   "email": "owner@example.com",
     *   "password": "secure_password",
     *   "password_confirmation": "secure_password",
     *   "business_name": "Ahmed's Barbershop",
     *   "branch_name": "Main Branch",
     *   "branch_address": "123 Street, Cairo"
     * }
     */
    public function store(RegisterRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $validated = $request->validated();

            // Create owner user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => UserRole::Owner,
                'is_active' => true,
            ]);

            // Create business
            $business = Business::create([
                'owner_user_id' => $user->id,
                'name' => $validated['business_name'],
                'slug' => Str::slug($validated['business_name']).'-'.Str::random(6),
                'subscription_status' => 'trial',
                'subscription_expires_at' => now()->addDays(14),
            ]);

            // Attach user to business
            $user->update(['business_id' => $business->id]);

            // Create first branch
            Branch::create([
                'business_id' => $business->id,
                'name' => $validated['branch_name'],
                'address' => $validated['branch_address'],
                'city' => $validated['city'] ?? 'Cairo',
                'slug' => 'main',
                'is_active' => true,
            ]);

            // Create token
            $token = $user->createToken('auth')->plainTextToken;

            return response()->json([
                'data' => [
                    'user' => new UserResource($user),
                    'business' => [
                        'id' => $business->id,
                        'name' => $business->name,
                        'slug' => $business->slug,
                        'subscription_expires_at' => $business->subscription_expires_at,
                    ],
                    'token' => $token,
                ],
                'message' => 'Account created successfully. Welcome!',
            ], 201);
        });
    }
}
