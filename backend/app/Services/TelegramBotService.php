<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\TelegramUser;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class TelegramBotService
{
    private Client $client;

    private string $botToken;

    private string $apiUrl;

    /**
     * TelegramBotService constructor.
     */
    public function __construct()
    {
        $this->client = app(Client::class);
        $this->botToken = (string) config('services.telegram.bot_token');
        $this->apiUrl = "https://api.telegram.org/bot{$this->botToken}";
    }

    /**
     * Handle an incoming update from Telegram.
     *
     * @param  array<string, mixed>  $update  The webhook update payload.
     */
    public function handleUpdate(array $update): void
    {
        if (isset($update['message'])) {
            $message = $update['message'];
            $chatId = $message['chat']['id'];
            $text = $message['text'] ?? '';

            if ($text === '/start') {
                $this->handleStartCommand($chatId, $message['chat']);
            } elseif ($text === '/help') {
                $this->sendMessage($chatId, $this->getHelpText());
            }
        } elseif (isset($update['callback_query'])) {
            $this->handleCallbackQuery($update['callback_query']);
        }
    }

    /**
     * Handle the /start command from a Telegram user.
     *
     * @param  int  $chatId  The Telegram chat ID.
     * @param  array<string, mixed>  $chat  The chat information.
     */
    private function handleStartCommand(int $chatId, array $chat): void
    {
        $firstName = $chat['first_name'] ?? 'User';
        $username = $chat['username'] ?? null;

        TelegramUser::updateOrCreate(
            ['telegram_id' => $chatId],
            [
                'telegram_username' => $username,
                'first_name' => $firstName,
                'status' => 'active',
                'connected_at' => now(),
            ]
        );

        $welcomeText = <<<TEXT
👋 مرحباً {$firstName}!

أنت الآن متصل مع نظام Barber SaaS

هنا ستتلقى:
✅ إشعارات الحجوزات الجديدة
✅ ملخص يومي
✅ تنبيهات مهمة

اكتب /help لمزيد من الخيارات
TEXT;

        $this->sendMessage($chatId, $welcomeText);
    }

    /**
     * Send a message to a Telegram chat.
     *
     * @param  int  $chatId  The Telegram chat ID.
     * @param  string  $text  The message text (HTML supported).
     * @param  array<string, mixed>|null  $options  Additional Telegram API options.
     * @return bool True if the message was sent successfully.
     */
    public function sendMessage(int $chatId, string $text, ?array $options = null): bool
    {
        try {
            $response = $this->client->post("{$this->apiUrl}/sendMessage", [
                'json' => array_merge([
                    'chat_id' => $chatId,
                    'text' => $text,
                    'parse_mode' => 'HTML',
                ], $options ?? []),
            ]);

            return $response->getStatusCode() === 200;
        } catch (\Exception $e) {
            Log::error('Telegram send error', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Send a booking notification to an owner or staff member via Telegram.
     *
     * @param  string  $telegramId  The Telegram chat ID.
     * @param  string  $customerName  The customer's name.
     * @param  string  $serviceName  The booked service name.
     * @param  string  $time  The appointment time.
     * @param  string  $price  The booking price.
     */
    public function sendBookingNotification(
        string $telegramId,
        string $customerName,
        string $serviceName,
        string $time,
        string $price
    ): void {
        $text = <<<TEXT
🆕 <b>حجز جديد!</b>

👤 العميل: <b>{$this->escapeHtml($customerName)}</b>
✂️ الخدمة: <b>{$this->escapeHtml($serviceName)}</b>
⏰ الموقت: <b>{$this->escapeHtml($time)}</b>
💵 السعر: <b>{$this->escapeHtml($price)} ج.م</b>

📱 <a href="https://barber-saas.com/dashboard">فتح اللوحة</a>
TEXT;

        $this->sendMessage((int) $telegramId, $text);
    }

    /**
     * Send a daily summary to the business owner via Telegram.
     *
     * @param  string  $telegramId  The Telegram chat ID.
     * @param  int  $totalBookings  Total bookings for the day.
     * @param  int  $completedBookings  Completed bookings for the day.
     * @param  float  $revenue  Total revenue for the day.
     * @param  array<int, array<string, mixed>>  $topStaff  Top staff members.
     */
    public function sendDailySummary(
        string $telegramId,
        int $totalBookings,
        int $completedBookings,
        float $revenue,
        array $topStaff = []
    ): void {
        $text = <<<TEXT
📊 <b>الملخص اليومي</b>

📈 إجمالي الحجوزات: <b>{$this->escapeHtml((string) $totalBookings)}</b>
✅ المكتملة: <b>{$this->escapeHtml((string) $completedBookings)}</b>
💰 الإيرادات: <b>{$this->escapeHtml((string) $revenue)} ج.م</b>
TEXT;

        if (! empty($topStaff)) {
            $text .= "\n\n⭐ <b>أفضل الموظفين:</b>\n";
            foreach ($topStaff as $staff) {
                $name = $this->escapeHtml((string) ($staff['name'] ?? ''));
                $bookings = $this->escapeHtml((string) ($staff['bookings'] ?? 0));
                $text .= "• {$name}: {$bookings} حجز\n";
            }
        }

        $this->sendMessage((int) $telegramId, $text);
    }

    /**
     * Send an appointment reminder to staff via Telegram.
     *
     * @param  string  $telegramId  The Telegram chat ID.
     * @param  string  $customerName  The customer's name.
     * @param  string  $time  The appointment time.
     */
    public function sendAppointmentReminder(
        string $telegramId,
        string $customerName,
        string $time
    ): void {
        $text = <<<TEXT
⏰ <b>تذكير الموعد</b>

العميل: <b>{$this->escapeHtml($customerName)}</b>
الموقت: <b>{$this->escapeHtml($time)}</b>

سيحضر العميل غداً؟
TEXT;

        $this->sendMessage((int) $telegramId, $text);
    }

    /**
     * Handle a callback query from Telegram inline keyboards.
     *
     * @param  array<string, mixed>  $callbackQuery  The callback query payload.
     */
    private function handleCallbackQuery(array $callbackQuery): void
    {
        // Placeholder for handling inline keyboard callbacks
    }

    /**
     * Get the help text for the Telegram bot.
     *
     * @return string The help message.
     */
    private function getHelpText(): string
    {
        return <<<'TEXT'
🆘 <b>المساعدة</b>

أوامر متاحة:
/start - ابدأ من جديد
/help - هذه الرسالة
/today - ملخص اليوم
/stats - الإحصائيات

المزيد من الخيارات في لوحة التحكم
TEXT;
    }

    private function escapeHtml(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
}
