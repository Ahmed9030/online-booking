<?php

use Illuminate\Support\Facades\Route;

// Admin Routes (Sanctum protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/businesses', function () {
        return response()->json(['message' => 'Admin businesses placeholder']);
    });
});
