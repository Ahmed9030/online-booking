<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        \App\Events\BookingCreated::class => [
            \App\Listeners\DispatchBookingConfirmationJob::class,
        ],
        // Booking lifecycle events
        \App\Events\BookingCompleted::class => [
            \App\Listeners\UpdateCustomerVisitStats::class,
        ],
        \App\Events\BookingCancelled::class => [
            // Add listeners for cancellations here
        ],
    ];
}
