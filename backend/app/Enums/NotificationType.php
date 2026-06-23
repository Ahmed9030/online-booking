<?php

declare(strict_types=1);

namespace App\Enums;

enum NotificationType: string
{
    case Confirmation = 'confirmation';
    case Reminder = 'reminder';
    case Cancellation = 'cancellation';
}
