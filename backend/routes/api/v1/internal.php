<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Internal\DueRemindersController;
use App\Http\Controllers\Api\V1\Internal\NotificationCallbackController;
use Illuminate\Support\Facades\Route;

Route::middleware(['internal.webhook.secret', 'throttle:100,1'])->group(function () {
    // n8n polls for due reminders
    Route::get('bookings/due-reminders', [DueRemindersController::class, 'index']);

    // n8n reports back on delivery
    Route::post('notifications/{id}/sent', [NotificationCallbackController::class, 'sent']);
    Route::post('notifications/{id}/failed', [NotificationCallbackController::class, 'failed']);
});
