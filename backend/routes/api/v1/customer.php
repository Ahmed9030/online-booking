<?php

use Illuminate\Support\Facades\Route;

// Customer Routes (Sanctum/OTP protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/bookings', function () {
        return response()->json(['message' => 'Customer bookings placeholder']);
    });
});
