<?php

declare(strict_types=1);

namespace App\Models;

use GuzzleHttp\Client;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

final class TelegramUser extends Model
{
    use HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'telegram_id',
        'telegram_username',
        'first_name',
        'status',
        'connected_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'connected_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, TelegramUser>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Send a Telegram message to this user.
     *
     * @param  string  $text  The message text (HTML supported).
     * @param  array<string, mixed>|null  $options  Additional Telegram API options.
     * @return bool True if the message was sent successfully.
     */
    public function sendMessage(string $text, ?array $options = null): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        try {
            $client = app(\GuzzleHttp\Client::class);
            $botToken = config('services.telegram.bot_token');
            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

            $response = $client->post($url, [
                'json' => array_merge([
                    'chat_id' => $this->telegram_id,
                    'text' => $text,
                    'parse_mode' => 'HTML',
                ], $options ?? []),
            ]);

            return $response->getStatusCode() === 200;
        } catch (\Exception $e) {
            Log::error('Telegram send failed', [
                'user_id' => $this->user_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
