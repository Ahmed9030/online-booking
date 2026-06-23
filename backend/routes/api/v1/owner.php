<?php

use Illuminate\Support\Facades\Route;

// Owner Routes (Sanctum, role and subscription protected)
Route::middleware(['auth:sanctum', 'role:owner', 'subscription.active'])->group(function () {
    Route::get('/dashboard', function () {
        return response()->json(['message' => 'Owner dashboard placeholder']);
    });
});
