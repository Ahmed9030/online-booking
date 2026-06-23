<?php

declare(strict_types=1);

namespace App\Enums;

enum BookingStatus: string
{
    case Confirmed = 'confirmed';
    case Completed = 'completed';
    case NoShow = 'no_show';
    case Cancelled = 'cancelled';
}
