<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Models\NotificationLog;
use Illuminate\Http\JsonResponse;

class NotificationCallbackController extends Controller
{
    /**
     * n8n reports that a notification was sent successfully.
     * POST /api/v1/internal/notifications/{id}/sent
     */
    public function sent(string $id): JsonResponse
    {
        $log = NotificationLog::findOrFail($id);

        $log->update([
            'status'  => 'sent',
            'sent_at' => now(),
        ]);

        return response()->json(['message' => 'Notification marked as sent.']);
    }

    /**
     * n8n reports that a notification failed.
     * POST /api/v1/internal/notifications/{id}/failed
     */
    public function failed(string $id): JsonResponse
    {
        $log = NotificationLog::findOrFail($id);

        $log->update([
            'status'        => 'failed',
            'error_message' => request()->input('error_message'),
        ]);

        return response()->json(['message' => 'Notification marked as failed.']);
    }
}
