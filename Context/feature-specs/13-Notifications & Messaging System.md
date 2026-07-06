# Phase 7: Notifications & Messaging System
# Booking SaaS — Telegram Bot + In-App + Push + Email

> Complete specification for multi-channel notifications.
> Telegram for staff/owner. In-App + Push + Email for customers.
> Zero cost. Production-ready.

---

## 🎯 Notification Strategy

```
┌─────────────────────────────────────────────────────────┐
│           NOTIFICATION DELIVERY SYSTEM                  │
└─────────────────────────────────────────────────────────┘

OWNER / STAFF
└─→ Telegram Bot (Instant, Always On)
    ├─ New booking assigned
    ├─ Booking completed
    ├─ Daily summary (morning)
    └─ Urgent alerts

CUSTOMER
├─→ In-App Notification (Real-time)
│   ├─ Booking confirmed
│   ├─ 24h reminder before appointment
│   └─ Booking cancelled/changed
│
├─→ Push Notification (Phone Alert)
│   ├─ Same as In-App
│   └─ Shows even if app closed
│
└─→ Email (Optional Backup)
    └─ Important reminders only
```

---

## PART 1: Database Schema

### Table: `notifications` (For In-App)

```php
// database/migrations/2026_06_28_create_notifications_table.php

Schema::create('notifications', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->index();
    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    
    $table->string('type'); // 'booking_confirmed', 'booking_reminder', etc.
    $table->string('title');
    $table->text('message');
    $table->json('data')->nullable(); // Extra data (booking_id, customer_name, etc.)
    
    $table->string('icon')->nullable(); // emoji or icon name
    $table->string('action_url')->nullable(); // /ar/my-bookings/123
    
    $table->boolean('is_read')->default(false);
    $table->timestamp('read_at')->nullable();
    
    $table->softDeletes();
    $table->timestamps();
    
    $table->index(['user_id', 'is_read']);
});
```

### Table: `push_subscriptions` (For Push Notifications)

```php
// database/migrations/2026_06_28_create_push_subscriptions_table.php

Schema::create('push_subscriptions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->index();
    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    
    $table->json('subscription'); // Browser's push subscription object
    $table->string('user_agent')->nullable(); // Device info
    
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

### Table: `telegram_users` (For Telegram Bot)

```php
// database/migrations/2026_06_28_create_telegram_users_table.php

Schema::create('telegram_users', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->unique()->nullable(); // Link to users table
    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    
    $table->bigInteger('telegram_id')->unique(); // Telegram user ID
    $table->string('telegram_username')->nullable();
    $table->string('first_name')->nullable();
    
    $table->enum('status', ['active', 'inactive', 'blocked'])->default('active');
    $table->timestamp('connected_at')->nullable();
    
    $table->timestamps();
});
```

### Table: `notification_logs` (For Tracking)

```php
// database/migrations/2026_06_28_create_notification_logs_table.php

Schema::create('notification_logs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('notification_id')->nullable();
    
    $table->enum('channel', ['telegram', 'in_app', 'push', 'email']);
    $table->uuid('recipient_id');
    $table->string('recipient_type'); // 'User', 'Customer', etc.
    
    $table->enum('status', ['sent', 'delivered', 'read', 'failed'])->default('sent');
    $table->text('error_message')->nullable();
    
    $table->timestamps();
    
    $table->index(['recipient_id', 'channel', 'status']);
});
```

---

## PART 2: Backend - Telegram Bot Setup

### Model: `src/app/Models/TelegramUser.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TelegramUser extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'telegram_id',
        'telegram_username',
        'first_name',
        'status',
        'connected_at',
    ];

    protected $casts = [
        'connected_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Send Telegram message
     */
    public function sendMessage(string $text, ?array $options = null): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        try {
            $client = new \GuzzleHttp\Client();
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
            \Log::error('Telegram send failed', [
                'user_id' => $this->user_id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
```

### Service: `src/app/Services/TelegramBotService.php`

```php
<?php

namespace App\Services;

use App\Models\TelegramUser;
use GuzzleHttp\Client;

class TelegramBotService
{
    private $client;
    private $botToken;
    private $apiUrl;

    public function __construct()
    {
        $this->client = new Client();
        $this->botToken = config('services.telegram.bot_token');
        $this->apiUrl = "https://api.telegram.org/bot{$this->botToken}";
    }

    /**
     * Handle webhook from Telegram
     */
    public function handleUpdate(array $update): void
    {
        if (isset($update['message'])) {
            $message = $update['message'];
            $chatId = $message['chat']['id'];
            $text = $message['text'] ?? '';

            // Handle /start command
            if ($text === '/start') {
                $this->handleStartCommand($chatId, $message['chat']);
            }
            // Handle other commands
            elseif ($text === '/help') {
                $this->sendMessage($chatId, $this->getHelpText());
            }
            // Handle callback queries
            elseif (isset($update['callback_query'])) {
                $this->handleCallbackQuery($update['callback_query']);
            }
        }
    }

    /**
     * Handle /start command
     */
    private function handleStartCommand(int $chatId, array $chat): void
    {
        $firstName = $chat['first_name'] ?? 'User';
        $username = $chat['username'] ?? null;

        // Create or update Telegram user
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
👋 مرحباً $firstName!

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
     * Send message to Telegram
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
            \Log::error('Telegram send error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send booking notification to owner/staff
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

👤 العميل: <b>$customerName</b>
✂️ الخدمة: <b>$serviceName</b>
⏰ الموقت: <b>$time</b>
💵 السعر: <b>$price ج.م</b>

📱 <a href="https://barber-saas.com/dashboard">فتح اللوحة</a>
TEXT;

        $this->sendMessage((int)$telegramId, $text);
    }

    /**
     * Send daily summary to owner
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

📈 إجمالي الحجوزات: <b>$totalBookings</b>
✅ المكتملة: <b>$completedBookings</b>
💰 الإيرادات: <b>$revenue ج.م</b>
TEXT;

        if (!empty($topStaff)) {
            $text .= "\n\n⭐ <b>أفضل الموظفين:</b>\n";
            foreach ($topStaff as $staff) {
                $text .= "• {$staff['name']}: {$staff['bookings']} حجز\n";
            }
        }

        $this->sendMessage((int)$telegramId, $text);
    }

    /**
     * Send appointment reminder (24h before)
     */
    public function sendAppointmentReminder(
        string $telegramId,
        string $customerName,
        string $time
    ): void {
        $text = <<<TEXT
⏰ <b>تذكير الموعد</b>

العميل: <b>$customerName</b>
الموقت: <b>$time</b>

سيحضر العميل غداً؟
TEXT;

        $this->sendMessage((int)$telegramId, $text);
    }

    /**
     * Get help text
     */
    private function getHelpText(): string
    {
        return <<<TEXT
🆘 <b>المساعدة</b>

أوامر متاحة:
/start - ابدأ من جديد
/help - هذه الرسالة
/today - ملخص اليوم
/stats - الإحصائيات

المزيد من الخيارات في لوحة التحكم
TEXT;
    }
}
```

### Controller: `src/app/Http/Controllers/Api/V1/Telegram/WebhookController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1\Telegram;

use App\Http\Controllers\Controller;
use App\Services\TelegramBotService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WebhookController extends Controller
{
    public function __construct(
        private readonly TelegramBotService $telegramService,
    ) {}

    /**
     * Handle Telegram webhook
     * POST /api/v1/telegram/webhook
     */
    public function handle(Request $request): JsonResponse
    {
        $update = $request->all();

        try {
            $this->telegramService->handleUpdate($update);
        } catch (\Exception $e) {
            \Log::error('Telegram webhook error', [
                'error' => $e->getMessage(),
                'update' => $update,
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
```

### Route: Add to `routes/api/v1/telegram.php`

```php
<?php

use App\Http\Controllers\Api\V1\Telegram\WebhookController;
use Illuminate\Support\Facades\Route;

Route::post('webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware('auth:sanctum');
```

---

## PART 3: In-App Notifications

### Model: `src/app/Models/Notification.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'icon',
        'action_url',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark as read
     */
    public function markAsRead(): void
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }
}
```

### Service: `src/app/Services/NotificationService.php`

```php
<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Send booking confirmation to customer
     */
    public function sendBookingConfirmation(
        User $customer,
        array $bookingData
    ): void {
        Notification::create([
            'user_id' => $customer->id,
            'type' => 'booking_confirmed',
            'title' => '✅ تم تأكيد حجزك',
            'message' => "حجزك عند {$bookingData['barber']} في {$bookingData['time']} تم تأكيده",
            'data' => $bookingData,
            'icon' => '✅',
            'action_url' => "/ar/my-bookings/{$bookingData['booking_id']}",
        ]);

        // Send push notification
        $this->sendPushNotification(
            $customer->id,
            'حجزك تم تأكيده ✅',
            "حجزك عند {$bookingData['barber']} في {$bookingData['time']}"
        );
    }

    /**
     * Send appointment reminder to customer (24h before)
     */
    public function sendAppointmentReminder(
        User $customer,
        array $bookingData
    ): void {
        Notification::create([
            'user_id' => $customer->id,
            'type' => 'booking_reminder',
            'title' => '⏰ تذكير موعدك',
            'message' => "موعدك عند {$bookingData['barber']} غداً في {$bookingData['time']}",
            'data' => $bookingData,
            'icon' => '⏰',
            'action_url' => "/ar/my-bookings/{$bookingData['booking_id']}",
        ]);

        // Send push notification
        $this->sendPushNotification(
            $customer->id,
            'تذكير موعدك ⏰',
            "موعدك غداً في {$bookingData['time']}"
        );
    }

    /**
     * Send new booking assigned to staff
     */
    public function sendBookingAssignedToStaff(
        User $staff,
        array $bookingData
    ): void {
        // In-app notification
        Notification::create([
            'user_id' => $staff->id,
            'type' => 'booking_assigned',
            'title' => '🆕 حجز جديد لك',
            'message' => "حجز جديد من {$bookingData['customer_name']} في {$bookingData['time']}",
            'data' => $bookingData,
            'icon' => '🆕',
            'action_url' => "/ar/staff/schedule",
        ]);

        // Telegram notification
        $telegramUser = $staff->telegramUser;
        if ($telegramUser) {
            app(TelegramBotService::class)->sendBookingNotification(
                (string)$telegramUser->telegram_id,
                $bookingData['customer_name'],
                $bookingData['service_name'],
                $bookingData['time'],
                $bookingData['price']
            );
        }
    }

    /**
     * Send daily summary to owner
     */
    public function sendDailySummary(
        User $owner,
        array $summaryData
    ): void {
        $message = "تم {$summaryData['completed']} حجز • إيرادات: {$summaryData['revenue']} ج.م";

        // In-app notification
        Notification::create([
            'user_id' => $owner->id,
            'type' => 'daily_summary',
            'title' => '📊 الملخص اليومي',
            'message' => $message,
            'data' => $summaryData,
            'icon' => '📊',
            'action_url' => "/ar/dashboard",
        ]);

        // Telegram notification
        $telegramUser = $owner->telegramUser;
        if ($telegramUser) {
            app(TelegramBotService::class)->sendDailySummary(
                (string)$telegramUser->telegram_id,
                $summaryData['total_bookings'],
                $summaryData['completed_bookings'],
                $summaryData['revenue'],
                $summaryData['top_staff'] ?? []
            );
        }
    }

    /**
     * Send push notification
     */
    public function sendPushNotification(
        string $userId,
        string $title,
        string $body,
        ?string $icon = null,
        ?string $badge = null
    ): void {
        $subscriptions = \DB::table('push_subscriptions')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        foreach ($subscriptions as $sub) {
            try {
                $subscription = json_decode($sub->subscription, true);
                
                $webPush = new \Minishlink\WebPush\WebPush();
                $webPush->addAuth(config('services.push.auth'));
                
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
                \Log::error('Push notification failed', [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
```

---

## PART 4: Frontend - In-App Notifications

### Hook: `src/features/notifications/hooks/useNotifications.ts`

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications')
      return response.data.data
    },
    refetchInterval: 10000, // Poll every 10 seconds
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
```

### Component: `src/components/notifications/NotificationBell.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useNotifications, useMarkNotificationAsRead } from '@/features/notifications/hooks/useNotifications'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function NotificationBell() {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const { data: notifications = [] } = useNotifications()
  const markAsRead = useMarkNotificationAsRead()

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 neu-btn hover:neu-card-hover transition-all"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 neu-card rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-text-muted">
            <h3 className="font-bold text-primary">{t('common.notifications')}</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              {t('notifications.no_notifications')}
            </div>
          ) : (
            <div className="divide-y divide-text-muted/20">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-surface transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead.mutate(notification.id)
                    }
                  }}
                >
                  <Link href={notification.action_url || '#'}>
                    <div className="flex gap-3">
                      <span className="text-xl">{notification.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-text-secondary mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-text-muted mt-2">
                          {new Date(notification.created_at).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## PART 5: Push Notifications Setup

### Install Service Worker

File: `public/service-worker.js`

```javascript
// Service Worker for Push Notifications

self.addEventListener('push', function (event) {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || true,
    data: data,
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
```

### Hook: `src/features/notifications/hooks/usePushNotifications.ts`

```typescript
'use client'

import { useEffect } from 'react'
import { api } from '@/services/api'

export function usePushNotifications() {
  useEffect(() => {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    const subscribeToPushNotifications = async () => {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js')

        // Request permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          return
        }

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })

        // Send subscription to backend
        await api.post('/notifications/subscribe', {
          subscription: subscription.toJSON(),
        })
      } catch (error) {
        console.error('Push notification setup failed:', error)
      }
    }

    subscribeToPushNotifications()
  }, [])
}
```

---

## PART 6: Events & Jobs

### Event: `src/app/Events/BookingConfirmed.php`

```php
<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingConfirmed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Booking $booking,
    ) {}
}
```

### Listener: `src/app/Listeners/SendBookingConfirmationNotification.php`

```php
<?php

namespace App\Listeners;

use App\Events\BookingConfirmed;
use App\Services\NotificationService;

class SendBookingConfirmationNotification
{
    public function __construct(
        private NotificationService $notificationService,
    ) {}

    public function handle(BookingConfirmed $event): void
    {
        $booking = $event->booking;

        $this->notificationService->sendBookingConfirmation(
            $booking->customer,
            [
                'booking_id' => $booking->id,
                'barber' => $booking->branch->name,
                'time' => $booking->starts_at->setTimezone('Africa/Cairo')->format('Y-m-d H:i'),
                'price' => $booking->service->price,
                'service_name' => $booking->service->name,
                'customer_name' => $booking->customer->name,
            ]
        );
    }
}
```

### Job: `src/app/Jobs/SendAppointmentReminders.php`

```php
<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendAppointmentReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(NotificationService $notificationService): void
    {
        // Get bookings for tomorrow
        $tomorrow = now('Africa/Cairo')->addDay()->startOfDay();
        $tomorrowEnd = $tomorrow->endOfDay();

        $bookings = Booking::whereBetween('starts_at', [$tomorrow, $tomorrowEnd])
            ->where('status', 'confirmed')
            ->with('customer', 'service', 'branch')
            ->get();

        foreach ($bookings as $booking) {
            $notificationService->sendAppointmentReminder(
                $booking->customer,
                [
                    'booking_id' => $booking->id,
                    'barber' => $booking->branch->name,
                    'time' => $booking->starts_at->setTimezone('Africa/Cairo')->format('H:i'),
                    'customer_name' => $booking->customer->name,
                ]
            );
        }
    }
}
```

### Job: `src/app/Jobs/SendDailySummary.php`

```php
<?php

namespace App\Jobs;

use App\Models\Business;
use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendDailySummary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(NotificationService $notificationService): void
    {
        $today = now('Africa/Cairo')->startOfDay();
        $todayEnd = $today->endOfDay();

        // Get all active businesses
        $businesses = Business::where('subscription_status', 'active')->get();

        foreach ($businesses as $business) {
            // Get today's bookings
            $bookings = Booking::where('business_id', $business->id)
                ->whereBetween('created_at', [$today, $todayEnd])
                ->get();

            $completedBookings = $bookings->where('status', 'completed')->count();
            $totalBookings = $bookings->count();
            $revenue = $bookings->where('status', 'completed')
                ->sum(fn($b) => $b->service->price);

            // Get top staff
            $topStaff = $bookings->where('status', 'completed')
                ->groupBy('staff_id')
                ->map(fn($group, $staffId) => [
                    'id' => $staffId,
                    'bookings' => $group->count(),
                ])
                ->sortByDesc('bookings')
                ->take(3)
                ->values()
                ->toArray();

            // Send summary to owner
            $owner = $business->ownerUser;
            if ($owner) {
                $notificationService->sendDailySummary($owner, [
                    'total_bookings' => $totalBookings,
                    'completed_bookings' => $completedBookings,
                    'revenue' => $revenue,
                    'top_staff' => $topStaff,
                ]);
            }
        }
    }
}
```

---

## PART 7: Configuration

### File: `config/services.php`

```php
return [
    // ... other services

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
    ],

    'push' => [
        'vapid_public_key' => env('VAPID_PUBLIC_KEY'),
        'vapid_private_key' => env('VAPID_PRIVATE_KEY'),
        'auth' => [
            'VAPID' => [
                'subject' => env('VAPID_SUBJECT'),
                'publicKey' => env('VAPID_PUBLIC_KEY'),
                'privateKey' => env('VAPID_PRIVATE_KEY'),
            ],
        ],
    ],
];
```

### File: `.env`

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/v1/telegram/webhook

# Push Notifications (Generate with web-push)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your@email.com
```

---

## PART 8: Setup Instructions

### Step 1: Generate Telegram Bot Token

1. Go to Telegram (@BotFather)
2. Create new bot: `/newbot`
3. Copy the token

### Step 2: Set Telegram Webhook

```bash
curl -F "url=https://yourdomain.com/api/v1/telegram/webhook" \
  https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook
```

### Step 3: Generate VAPID Keys (For Push Notifications)

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### Step 4: Run Database Migrations

```bash
php artisan migrate
```

### Step 5: Schedule Cron Jobs

In `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Send appointment reminders at 8 AM
    $schedule->job(new SendAppointmentReminders::class)
        ->dailyAt('08:00')
        ->timezone('Africa/Cairo');

    // Send daily summary at 6 PM
    $schedule->job(new SendDailySummary::class)
        ->dailyAt('18:00')
        ->timezone('Africa/Cairo');
}
```

---

## PART 9: API Endpoints

Add to `routes/api/v1/notifications.php`:

```php
<?php

use App\Http\Controllers\Api\V1\Notifications\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Get notifications
    Route::get('/', [NotificationController::class, 'index']);

    // Mark as read
    Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);

    // Delete notification
    Route::delete('/{id}', [NotificationController::class, 'destroy']);

    // Subscribe to push notifications
    Route::post('subscribe', [NotificationController::class, 'subscribe']);
});
```

---

## 📋 Implementation Checklist

### Backend
- [ ] Create all migrations
- [ ] Create Telegram models & service
- [ ] Create notification models & service
- [ ] Set up Telegram Bot
- [ ] Create events & listeners
- [ ] Create jobs for reminders
- [ ] Configure scheduler
- [ ] Test Telegram notifications
- [ ] Test in-app notifications

### Frontend
- [ ] Create notification hooks
- [ ] Create notification bell component
- [ ] Set up service worker
- [ ] Set up push notifications hook
- [ ] Test push notifications
- [ ] Test notification bell UI

### Configuration
- [ ] Get Telegram bot token
- [ ] Generate VAPID keys
- [ ] Set environment variables
- [ ] Set up webhook URL
- [ ] Test all channels

---

## 🎯 Notification Flow

```
BOOKING CREATED
├─→ Event: BookingConfirmed
│   └─→ Listener: SendBookingConfirmationNotification
│       ├─→ Create in-app notification
│       ├─→ Send push notification
│       └─→ Send Telegram to staff
│
APPOINTMENT TOMORROW
└─→ Job: SendAppointmentReminders (scheduled daily 8 AM)
    ├─→ Query tomorrow's bookings
    ├─→ Send in-app notification to customers
    └─→ Send push notification to customers

DAILY SUMMARY
└─→ Job: SendDailySummary (scheduled daily 6 PM)
    ├─→ Get today's bookings
    ├─→ Calculate stats
    ├─→ Send in-app notification to owner
    └─→ Send Telegram to owner
```

---

Complete, production-ready notification system! 🚀