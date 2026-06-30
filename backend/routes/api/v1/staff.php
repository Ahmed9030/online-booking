<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Staff\DashboardController;
use App\Http\Controllers\Api\V1\Staff\ScheduleController;
use App\Http\Controllers\Api\V1\Staff\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:staff', 'subscription.active'])->group(function () {
    // Dashboard overview
    Route::get('dashboard', [DashboardController::class, 'index']);

    // View own schedule
    Route::get('schedule', [ScheduleController::class, 'index']);
    Route::get('schedule/{date}', [ScheduleController::class, 'show']);

    // List all staff bookings (paginated)
    Route::get('bookings', [ScheduleController::class, 'listBookings']);

    // Update booking status
    Route::patch('bookings/{id}/completed', [ScheduleController::class, 'markCompleted']);
    Route::patch('bookings/{id}/no-show', [ScheduleController::class, 'markNoShow']);
    Route::patch('bookings/{id}/cancelled', [ScheduleController::class, 'markCancelled']);

    // Settings
    Route::get('settings', [SettingsController::class, 'show']);
    Route::patch('settings', [SettingsController::class, 'update']);
    Route::patch('settings/password', [SettingsController::class, 'updatePassword']);
});
