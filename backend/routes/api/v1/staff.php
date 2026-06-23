<?php

use Illuminate\Support\Facades\Route;

// Staff Routes (Sanctum protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/schedule', function () {
        return response()->json(['message' => 'Staff schedule placeholder']);
    });
});
