<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Notifications\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::patch('{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('{id}', [NotificationController::class, 'destroy']);
    Route::post('subscribe', [NotificationController::class, 'subscribe']);
});
