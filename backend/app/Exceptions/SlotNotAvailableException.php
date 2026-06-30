<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

final class SlotNotAvailableException extends Exception
{
    /**
     * Render the exception as a JSON response.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function render()
    {
        return response()->json([
            'message' => $this->getMessage() !== ''
                ? $this->getMessage()
                : 'The requested time slot is not available.',
        ], 422);
    }
}
