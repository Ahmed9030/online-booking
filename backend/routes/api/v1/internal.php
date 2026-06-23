<?php

use Illuminate\Support\Facades\Route;

// Internal Routes (Secret verification protected)
Route::get('/reminders', function () {
    return response()->json(['message' => 'Internal reminders placeholder']);
});
