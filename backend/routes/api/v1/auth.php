<?php

use Illuminate\Support\Facades\Route;

// Auth Routes
Route::post('/register', function () {
    return response()->json(['message' => 'Register endpoint placeholder']);
});

Route::post('/login', function () {
    return response()->json(['message' => 'Login endpoint placeholder']);
});
