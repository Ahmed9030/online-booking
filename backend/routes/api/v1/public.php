<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Public\AvailabilityController;
use App\Http\Controllers\Api\V1\Public\BookingController as PublicBookingController;
use App\Http\Controllers\Api\V1\Public\BranchController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:60,1')->group(function () {
    // Get business + branches by slug
    Route::get('business/{slug}', [BranchController::class, 'showBusiness']);
    Route::get('business/{businessSlug}/branches/{branchSlug}', [BranchController::class, 'show']);

    // Get services for a branch
    Route::get('branches/{id}/services', [BranchController::class, 'services']);

    // Get available slots
    Route::post('availability/check', [AvailabilityController::class, 'check']);

    // Create booking (public flow — customer provides phone, gets OTP)
    Route::post('bookings', [PublicBookingController::class, 'store']);
});
