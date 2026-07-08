<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Telegram;

use App\Http\Controllers\Controller;
use App\Services\TelegramBotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * @param  TelegramBotService  $telegramService  The Telegram bot service.
     */
    public function __construct(
        private readonly TelegramBotService $telegramService,
    ) {}

    /**
     * Handle an incoming Telegram webhook update.
     *
     * @param  Request  $request  The incoming HTTP request.
     * @return JsonResponse Always returns 200 OK to acknowledge receipt.
     */
    public function handle(Request $request): JsonResponse
    {
        $secret = config('services.telegram.secret_token');

        if (empty($secret)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $token = (string) $request->header('X-Telegram-Bot-Api-Secret-Token');

        if (! hash_equals($secret, $token)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $update = $request->all();

        try {
            $this->telegramService->handleUpdate($update);
        } catch (\Exception $e) {
            Log::error('Telegram webhook error', [
                'error' => $e->getMessage(),
                'update_id' => $update['update_id'] ?? 'unknown',
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
