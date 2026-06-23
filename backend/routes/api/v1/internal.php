<?php

use Illuminate\Support\Facades\Route;

// Internal Routes (Secret verification protected)
Route::middleware(['internal.webhook.secret', 'throttle:100,1'])->group(function () {
    Route::get('/bookings/due-reminders', function () {
        return response()->json(['message' => 'Internal reminders placeholder']);
    });
});
