<?php

use Illuminate\Support\Facades\Route;

// Staff Routes (Sanctum, role and subscription protected)
Route::middleware(['auth:sanctum', 'role:staff', 'subscription.active'])->group(function () {
    Route::get('/schedule', function () {
        return response()->json(['message' => 'Staff schedule placeholder']);
    });
});
