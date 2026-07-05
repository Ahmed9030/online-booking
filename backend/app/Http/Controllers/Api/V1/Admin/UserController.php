<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserController extends Controller
{
    /**
     * List all platform users with optional role/status filtering.
     */
    public function index(Request $request): ResourceCollection
    {
        $query = User::withoutGlobalScopes()->orderByDesc('created_at');

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->has('is_active') && $request->input('is_active') !== null) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(min((int) ($request->input('per_page', 15)), 100));

        return UserResource::collection($users);
    }

    /**
     * Get a single user's details.
     */
    public function show(string $id): JsonResponse
    {
        $user = User::withoutGlobalScopes()->with('business')->findOrFail($id);

        return response()->json([
            'data' => array_merge(
                (new UserResource($user))->resolve(),
                [
                    'business' => $user->business ? [
                        'id' => $user->business->id,
                        'name' => $user->business->name,
                        'slug' => $user->business->slug,
                        'subscription_status' => $user->business->subscription_status,
                    ] : null,
                ]
            ),
        ]);
    }

    /**
     * Toggle a user's active status (activate/suspend).
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $user = User::withoutGlobalScopes()->findOrFail($id);

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        return response()->json([
            'data' => new UserResource($user),
            'message' => $user->is_active ? 'User activated.' : 'User deactivated.',
        ]);
    }
}
