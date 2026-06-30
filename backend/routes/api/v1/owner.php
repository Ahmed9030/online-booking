<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Owner\BookingController;
use App\Http\Controllers\Api\V1\Owner\BranchController;
use App\Http\Controllers\Api\V1\Owner\CustomerController;
use App\Http\Controllers\Api\V1\Owner\DashboardController;
use App\Http\Controllers\Api\V1\Owner\ServiceController;
use App\Http\Controllers\Api\V1\Owner\SettingsController;
use App\Http\Controllers\Api\V1\Owner\StaffController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:owner', 'subscription.active'])->group(function () {
    // Dashboard overview
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Branches CRUD
    Route::apiResource('branches', BranchController::class);
    Route::post('branches/{id}/working-hours', [BranchController::class, 'updateWorkingHours']);
    Route::get('branches/{id}/bookings', [BranchController::class, 'bookings']);

    // Staff CRUD
    Route::apiResource('staff', StaffController::class);
    Route::post('staff/{id}/working-hours', [StaffController::class, 'updateWorkingHours']);
    Route::post('staff/{id}/services', [StaffController::class, 'assignServices']);
    Route::post('staff/{id}/login-credentials', [StaffController::class, 'createLoginCredentials']);

    // Services CRUD
    Route::apiResource('services', ServiceController::class);

    // Bookings (owner view)
    Route::get('bookings', [BookingController::class, 'index']);
    Route::post('bookings', [BookingController::class, 'store']); // Manual booking
    Route::get('bookings/{id}', [BookingController::class, 'show']);
    Route::patch('bookings/{id}/status', [BookingController::class, 'updateStatus']);
    Route::delete('bookings/{id}', [BookingController::class, 'destroy']);

    // Customers
    Route::get('customers', [CustomerController::class, 'index']);
    Route::get('customers/{id}', [CustomerController::class, 'show']);
    Route::get('customers/{id}/bookings', [CustomerController::class, 'bookings']);

    // Settings
    Route::get('settings', [SettingsController::class, 'show']);
    Route::patch('settings', [SettingsController::class, 'update']);
    Route::patch('settings/password', [SettingsController::class, 'updatePassword']);
});
