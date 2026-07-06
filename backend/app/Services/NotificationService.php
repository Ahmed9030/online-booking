<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;

class NotificationService
{
    private TelegramBotService $telegramBotService;

    public function __construct(TelegramBotService $telegramBotService)
    {
        $this->telegramBotService = $telegramBotService;
    }

    /**
     * Send a booking confirmation notification to the customer.
     *
     * @param  User  $customer  The customer user.
     * @param  array<string, mixed>  $bookingData  The booking details.
     */
    public function sendBookingConfirmation(User $customer, array $bookingData): void
    {
        Notification::create([
            'user_id' => $customer->id,
            'type' => 'booking_confirmed',
            'title' => '✅ تم تأكيد حجزك',
            'message' => "حجزك عند {$bookingData['barber']} في {$bookingData['time']} تم تأكيده",
            'data' => $bookingData,
            'icon' => '✅',
            'action_url' => "/ar/my-bookings/{$bookingData['booking_id']}",
        ]);

        $this->sendPushNotification(
            $customer->id,
            'حجزك تم تأكيده ✅',
            "حجزك عند {$bookingData['barber']} في {$bookingData['time']}"
        );
    }

    /**
     * Send an appointment reminder to the customer (24 hours before).
     *
     * @param  User  $customer  The customer user.
     * @param  array<string, mixed>  $bookingData  The booking details.
     */
    public function sendAppointmentReminder(User $customer, array $bookingData): void
    {
        Notification::create([
            'user_id' => $customer->id,
            'type' => 'booking_reminder',
            'title' => '⏰ تذكير موعدك',
            'message' => "موعدك عند {$bookingData['barber']} غداً في {$bookingData['time']}",
            'data' => $bookingData,
            'icon' => '⏰',
            'action_url' => "/ar/my-bookings/{$bookingData['booking_id']}",
        ]);

        $this->sendPushNotification(
            $customer->id,
            'تذكير موعدك ⏰',
            "موعدك غداً في {$bookingData['time']}"
        );
    }

    /**
     * Send a notification when a new booking is assigned to a staff member.
     *
     * @param  User  $staff  The staff user.
     * @param  array<string, mixed>  $bookingData  The booking details.
     */
    public function sendBookingAssignedToStaff(User $staff, array $bookingData): void
    {
        Notification::create([
            'user_id' => $staff->id,
            'type' => 'booking_assigned',
            'title' => '🆕 حجز جديد لك',
            'message' => "حجز جديد من {$bookingData['customer_name']} في {$bookingData['time']}",
            'data' => $bookingData,
            'icon' => '🆕',
            'action_url' => '/ar/staff/schedule',
        ]);

        $telegramUser = $staff->telegramUser;
        if ($telegramUser) {
            $this->telegramBotService->sendBookingNotification(
                (string) $telegramUser->telegram_id,
                $bookingData['customer_name'],
                $bookingData['service_name'],
                $bookingData['time'],
                $bookingData['price']
            );
        }
    }

    /**
     * Send a daily summary notification to the business owner.
     *
     * @param  User  $owner  The business owner user.
     * @param  array<string, mixed>  $summaryData  The daily summary data.
     */
    public function sendDailySummary(User $owner, array $summaryData): void
    {
        $message = "تم {$summaryData['completed']} حجز • إيرادات: {$summaryData['revenue']} ج.م";

        Notification::create([
            'user_id' => $owner->id,
            'type' => 'daily_summary',
            'title' => '📊 الملخص اليومي',
            'message' => $message,
            'data' => $summaryData,
            'icon' => '📊',
            'action_url' => '/ar/dashboard',
        ]);

        $telegramUser = $owner->telegramUser;
        if ($telegramUser) {
            $this->telegramBotService->sendDailySummary(
                (string) $telegramUser->telegram_id,
                $summaryData['total_bookings'],
                $summaryData['completed_bookings'],
                $summaryData['revenue'],
                $summaryData['top_staff'] ?? []
            );
        }
    }

    /**
     * Send a push notification to all active subscriptions for a user.
     *
     * @param  string  $userId  The user's UUID.
     * @param  string  $title  The notification title.
     * @param  string  $body  The notification body.
     * @param  string|null  $icon  Optional icon URL.
     * @param  string|null  $badge  Optional badge URL.
     */
    public function sendPushNotification(
        string $userId,
        string $title,
        string $body,
        ?string $icon = null,
        ?string $badge = null
    ): void {
        $subscriptions = DB::table('push_subscriptions')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        $webPush = new WebPush;
        $webPush->addAuth(config('services.push.auth'));

        foreach ($subscriptions as $sub) {
            try {
                $subscription = json_decode($sub->subscription, true);

                $payload = json_encode([
                    'title' => $title,
                    'body' => $body,
                    'icon' => $icon ?? config('app.logo'),
                    'badge' => $badge ?? config('app.badge'),
                    'tag' => 'notification',
                    'requireInteraction' => true,
                ]);

                $webPush->sendNotification($subscription, $payload);
            } catch (\Exception $e) {
                Log::error('Push notification failed', [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
