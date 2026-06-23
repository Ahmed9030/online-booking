<?php

use Illuminate\Support\Facades\Route;

// Owner Routes (Sanctum protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard', function () {
        return response()->json(['message' => 'Owner dashboard placeholder']);
    });
});
