<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class SendBookingConfirmationWebhook implements ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels;

    public function __construct(public readonly Booking $booking) {}

    public function handle(): void
    {
        // Placeholder: in production this would send a webhook to n8n
    }
}
