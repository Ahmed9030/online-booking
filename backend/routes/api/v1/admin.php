<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\BusinessController;
use App\Http\Controllers\Api\V1\Admin\OverviewController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Platform overview
    Route::get('overview', [OverviewController::class, 'index']);

    // Manage businesses
    Route::get('businesses', [BusinessController::class, 'index']);
    Route::get('businesses/{id}', [BusinessController::class, 'show']);
    Route::patch('businesses/{id}/subscription', [BusinessController::class, 'updateSubscription']);
    Route::patch('businesses/{id}/status', [BusinessController::class, 'updateStatus']);
});
