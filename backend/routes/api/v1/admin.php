<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\AnalyticsController;
use App\Http\Controllers\Api\V1\Admin\BusinessController;
use App\Http\Controllers\Api\V1\Admin\OverviewController;
use App\Http\Controllers\Api\V1\Admin\SubscriptionController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin API Routes — protected by Sanctum + admin role middleware
|--------------------------------------------------------------------------
|
| All routes in this group require an authenticated admin user.
| Provides platform-wide management: overview, businesses, users,
| subscriptions, and analytics.
|
*/

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Platform overview
    Route::get('overview', [OverviewController::class, 'index']);

    // Manage businesses
    Route::get('businesses', [BusinessController::class, 'index']);
    Route::get('businesses/{id}', [BusinessController::class, 'show']);
    Route::patch('businesses/{id}/subscription', [BusinessController::class, 'updateSubscription']);
    Route::patch('businesses/{id}/status', [BusinessController::class, 'updateStatus']);

    // Manage users
    Route::get('users', [UserController::class, 'index']);
    Route::get('users/{id}', [UserController::class, 'show']);
    Route::patch('users/{id}/status', [UserController::class, 'toggleStatus']);

    // Manage subscriptions
    Route::get('subscriptions', [SubscriptionController::class, 'index']);
    Route::get('subscriptions/expiring', [SubscriptionController::class, 'expiring']);
    Route::get('subscriptions/{id}', [SubscriptionController::class, 'show']);
    Route::patch('subscriptions/{id}/renew', [SubscriptionController::class, 'renew']);

    // Analytics
    Route::get('analytics', [AnalyticsController::class, 'index']);
});
