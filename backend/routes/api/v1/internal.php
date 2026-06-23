<?php

use Illuminate\Support\Facades\Route;

// Internal Routes (Secret verification protected)
Route::middleware(['throttle:100,1', 'internal.webhook.secret'])->group(function () { 
       Route::get('/bookings/due-reminders', function () {
        return response()->json(['message' => 'Internal reminders placeholder']);
    });
});
