<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

final class SlotNotAvailableException extends Exception
{
    public function render()
    {
        return response()->json([
            'message' => $this->message ?? 'The requested time slot is not available.',
        ], 422);
    }
}
