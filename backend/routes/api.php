<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(base_path('routes/api/v1/auth.php'));
    Route::prefix('public')->group(base_path('routes/api/v1/public.php'));
    Route::prefix('owner')->group(base_path('routes/api/v1/owner.php'));
    Route::prefix('staff')->group(base_path('routes/api/v1/staff.php'));
    Route::prefix('customer')->group(base_path('routes/api/v1/customer.php'));
    Route::prefix('admin')->group(base_path('routes/api/v1/admin.php'));
    Route::prefix('internal')->group(base_path('routes/api/v1/internal.php'));
});

