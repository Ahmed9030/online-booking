<?php

use Illuminate\Support\Facades\Route;

// Public Routes
Route::get('/ping', function () {
    return response()->json(['message' => 'pong']);
});
