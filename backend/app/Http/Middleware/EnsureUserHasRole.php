<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            throw new AuthenticationException();
        }

        $allowedRoles = array_map('strtolower', $roles);
        $userRole = $user->role->value;

        if (! in_array($userRole, $allowedRoles, true)) {
            abort(403, 'Insufficient permissions for this action.');
        }

        return $next($request);
    }
}
