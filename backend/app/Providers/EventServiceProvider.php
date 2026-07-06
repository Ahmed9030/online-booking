<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\BookingCancelled;
use App\Events\BookingCompleted;
use App\Events\BookingConfirmed;
use App\Events\BookingCreated;
use App\Listeners\DispatchBookingConfirmationJob;
use App\Listeners\SendBookingConfirmationNotification;
use App\Listeners\UpdateCustomerVisitStats;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        BookingCreated::class => [
            DispatchBookingConfirmationJob::class,
        ],
        BookingConfirmed::class => [
            SendBookingConfirmationNotification::class,
        ],
        BookingCompleted::class => [
            UpdateCustomerVisitStats::class,
        ],
        BookingCancelled::class => [
            // Add listeners for cancellations here
        ],
    ];
}
