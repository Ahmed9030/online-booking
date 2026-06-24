<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Customer\MyBookingsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Customer views own bookings
    Route::get('my-bookings', [MyBookingsController::class, 'index']);
    Route::get('my-bookings/{id}', [MyBookingsController::class, 'show']);
    Route::delete('my-bookings/{id}', [MyBookingsController::class, 'cancel']);
});
