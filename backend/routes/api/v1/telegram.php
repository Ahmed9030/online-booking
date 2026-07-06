<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Telegram\WebhookController;
use Illuminate\Support\Facades\Route;

Route::post('webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware('auth:sanctum');
