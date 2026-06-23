<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class VerifyInternalWebhookSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $headerSecret = $request->header('X-Internal-Secret');
        $expectedSecret = config('services.internal_webhook_secret');

        if (! $headerSecret || ! hash_equals($expectedSecret ?? '', $headerSecret)) {
            abort(401, 'Unauthorized.');
        }

        return $next($request);
    }
}
