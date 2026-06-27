<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\OtpController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:10,1')->group(function () {
    // Owner/Staff login (password-based)
    Route::post('login', [LoginController::class, 'store']);

    // Owner signup
    Route::post('register', [RegisterController::class, 'store']);

    // Customer OTP flow
    Route::post('otp/send', [OtpController::class, 'send']);
    Route::post('otp/verify', [OtpController::class, 'verify']);

    // Logout (authenticated)
    Route::middleware('auth:sanctum')->post('logout', [LoginController::class, 'destroy']);
});
