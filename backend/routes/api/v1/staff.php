<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Staff\ScheduleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:staff', 'subscription.active'])->group(function () {
    // View own schedule
    Route::get('schedule', [ScheduleController::class, 'index']);
    Route::get('schedule/{date}', [ScheduleController::class, 'show']);

    // Update booking status (mark completed/no-show)
    Route::patch('bookings/{id}/completed', [ScheduleController::class, 'markCompleted']);
    Route::patch('bookings/{id}/no-show', [ScheduleController::class, 'markNoShow']);
});
