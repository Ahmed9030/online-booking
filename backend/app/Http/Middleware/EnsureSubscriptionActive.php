<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureSubscriptionActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Business not found.');
        }

        if ($user->role->value === UserRole::Admin->value) {
            return $next($request);
        }

        $business = $user->business;

        if (! $business) {
            abort(403, 'Business not found.');
        }

        $isActive = in_array(
            $business->subscription_status->value,
            [SubscriptionStatus::Trial->value, SubscriptionStatus::Active->value],
            true,
        );

        if (! $isActive) {
            abort(403, 'Subscription has expired. Please renew to access the dashboard.');
        }

        if (
            $business->subscription_expires_at
            && now('Africa/Cairo')->greaterThan($business->subscription_expires_at)
        ) {
            abort(403, 'Subscription has expired. Please renew to access the dashboard.');
        }

        return $next($request);
    }
}
