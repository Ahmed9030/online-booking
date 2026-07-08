<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserHasRole
{
    /**
     * Ensure the authenticated user has one of the given roles.
     *
     * @param  Request  $request  The incoming request.
     * @param  Closure  $next  The next middleware handler.
     * @param  string  ...$roles  Allowed role names.
     *
     * @throws AuthenticationException If no user is authenticated.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            throw new AuthenticationException;
        }

        $allowedRoles = array_map('strtolower', $roles);
        $userRole = $user->role->value;

        if (! in_array($userRole, $allowedRoles, true)) {
            abort(403, 'Insufficient permissions for this action.');
        }

        return $next($request);
    }
}
