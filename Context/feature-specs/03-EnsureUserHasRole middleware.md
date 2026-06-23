# Middleware & Seeder Specification
# Booking SaaS — Barbershop Appointment Platform

> This spec covers the implementation of three critical Laravel 13 middleware classes
> and a DemoBusinessSeeder for local development.
> Follow every section in order. No code generation happens until the spec is complete.

---

## Overview

### What We're Building

| Item | Purpose | Security Critical |
|---|---|---|
| `EnsureUserHasRole` | Gate routes by user role (owner/staff/admin) | ✅ Yes |
| `EnsureSubscriptionActive` | Block dashboard access if subscription expired | ✅ Yes |
| `VerifyInternalWebhookSecret` | Protect n8n webhook routes from unauthorized access | ✅ Yes |
| `DemoBusinessSeeder` | Seed local dev DB with realistic sample data | ⚠️ Dev only |

### Where They Live

```
backend/
├── app/
│   └── Http/
│       ├── Middleware/
│       │   ├── EnsureUserHasRole.php          ← new
│       │   ├── EnsureSubscriptionActive.php   ← new
│       │   └── VerifyInternalWebhookSecret.php ← new
│       └── Kernel.php                         ← modify (register middleware)
├── database/
│   └── seeders/
│       ├── DatabaseSeeder.php                 ← modify (call DemoBusinessSeeder)
│       └── DemoBusinessSeeder.php             ← new
└── routes/
    └── api.php                                ← modify (use middleware)
```

---

## Middleware 1: `EnsureUserHasRole`

### Purpose

Gate API routes to specific user roles.
Checks that the authenticated user has one of the allowed roles.
Returns 403 Forbidden if the user's role doesn't match.

### File Path

`backend/app/Http/Middleware/EnsureUserHasRole.php`

### Implementation Notes

- Runs **after** auth middleware (assumes `auth:sanctum` already verified the user).
- Receives roles as parameters: `middleware('role:owner', 'role:staff', 'role:admin')`.
- Compares authenticated user's `role` field against the allowed list.
- Role is an enum: `UserRole::Owner`, `UserRole::Staff`, `UserRole::Admin`.
- Throws `AuthorizationException` (which Laravel converts to 403) if role doesn't match.
- Never skips this check — even if "it seems like the user should have access."

### Database Context (for reference)

```php
// users table has this column:
$table->enum('role', ['owner', 'staff', 'admin'])->default('owner');

// User model casts it:
protected $casts = [
    'role' => UserRole::class,
];

// UserRole enum:
enum UserRole: string {
    case Owner  = 'owner';
    case Staff  = 'staff';
    case Admin  = 'admin';
}
```

### Code Structure

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    // Handle the request — receives comma-separated roles from route middleware parameter
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Throw if no authenticated user
        if (! $request->user()) {
            throw new AuthenticationException();
        }

        // Parse roles from middleware parameter (e.g., "owner,staff" → ['owner', 'staff'])
        $allowedRoles = array_map('strtolower', $roles);

        // Get authenticated user's role
        $userRole = $request->user()->role->value; // enum to string

        // Check if user's role is in the allowed list
        if (! in_array($userRole, $allowedRoles, true)) {
            abort(403, 'Insufficient permissions for this action.');
        }

        return $next($request);
    }
}
```

### How to Use in Routes

```php
// In routes/api/v1/owner.php
Route::middleware(['auth:sanctum', 'role:owner'])
    ->prefix('owner')
    ->group(function () {
        Route::apiResource('branches', BranchController::class);
        Route::apiResource('staff', StaffController::class);
    });

// In routes/api/v1/staff.php
Route::middleware(['auth:sanctum', 'role:staff'])
    ->prefix('staff')
    ->group(function () {
        Route::get('schedule', ScheduleController::class . '@index');
    });

// In routes/api/v1/admin.php
Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::apiResource('businesses', BusinessController::class);
    });
```

---

## Middleware 2: `EnsureSubscriptionActive`

### Purpose

Gate dashboard (owner/staff) routes if the business's subscription has expired.
Allows public booking routes and login to work even if subscription is expired
(don't punish the customer for a late renewal).

### File Path

`backend/app/Http/Middleware/EnsureSubscriptionActive.php`

### Implementation Notes

- Runs **after** `EnsureUserHasRole` (assumes role is already verified).
- Only applies to routes where `role:owner` or `role:staff`.
- Checks `businesses.subscription_expires_at` against the current time.
- If expired, returns 403 with a clear message ("Subscription expired").
- Allows `subscription_status = 'trial'` (trial is technically active).
- Never affects: public booking, public auth, admin routes, or internal webhooks.

### Database Context

```php
// businesses table has these columns:
$table->enum('subscription_status', ['trial', 'active', 'expired', 'suspended'])
      ->default('trial');
$table->dateTime('subscription_expires_at')->nullable();
```

### Code Structure

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscriptionActive
{
    // Check if subscription is active
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Skip check for admin role (admins have full access)
        if ($user && $user->role->value === 'admin') {
            return $next($request);
        }

        // Get the user's business
        $business = $user?->business;

        if (! $business) {
            // If no business found, something is wrong — deny access
            abort(403, 'Business not found.');
        }

        // Check if subscription is active or in trial
        $isActive = in_array(
            $business->subscription_status->value,
            ['trial', 'active'],
            true,
        );

        if (! $isActive) {
            abort(
                403,
                'Subscription has expired. Please renew to access the dashboard.',
            );
        }

        // Check if expiry date has passed (double-check the status)
        if (
            $business->subscription_expires_at
            && now('Africa/Cairo')->greaterThan($business->subscription_expires_at)
        ) {
            abort(
                403,
                'Subscription has expired. Please renew to access the dashboard.',
            );
        }

        return $next($request);
    }
}
```

### How to Use in Routes

```php
// In routes/api/v1/owner.php
Route::middleware(['auth:sanctum', 'role:owner', 'subscription.active'])
    ->prefix('owner')
    ->group(function () {
        Route::apiResource('branches', BranchController::class);
        Route::apiResource('staff', StaffController::class);
    });

// In routes/api/v1/staff.php
Route::middleware(['auth:sanctum', 'role:staff', 'subscription.active'])
    ->prefix('staff')
    ->group(function () {
        Route::get('schedule', ScheduleController::class . '@index');
    });

// Public booking — NO subscription check
Route::middleware('throttle:60,1')
    ->prefix('public')
    ->group(function () {
        Route::post('bookings', PublicBookingController::class . '@store');
    });
```

---

## Middleware 3: `VerifyInternalWebhookSecret`

### Purpose

Protect internal routes (n8n callbacks, polling endpoints) from unauthorized access.
n8n includes a shared secret header in every request to these routes.
Verify the header matches the one in `.env` before allowing the request.

### File Path

`backend/app/Http/Middleware/VerifyInternalWebhookSecret.php`

### Implementation Notes

- Runs **without** `auth:sanctum` (these are not user-authenticated routes).
- n8n sends header: `X-Internal-Secret: {INTERNAL_WEBHOOK_SECRET}`
- Compare against `.env` value: `INTERNAL_WEBHOOK_SECRET`.
- Must be constant-time comparison (use `hash_equals()` to prevent timing attacks).
- Returns 401 Unauthorized if secret is missing or incorrect.
- **Never expose** the secret in error messages — always return generic "Unauthorized".

### Environment Setup

```ini
# In backend/.env
INTERNAL_WEBHOOK_SECRET=your_long_random_secret_string_at_least_32_chars_change_this_before_production
```

Generate a strong secret:
```
php -r "echo bin2hex(random_bytes(32));"
```

### Code Structure

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyInternalWebhookSecret
{
    // Verify the X-Internal-Secret header matches the one in .env
    public function handle(Request $request, Closure $next): Response
    {
        $headerSecret = $request->header('X-Internal-Secret');
        $expectedSecret = config('services.internal_webhook_secret');

        // Use hash_equals() for constant-time comparison (prevents timing attacks)
        if (! $headerSecret || ! hash_equals($expectedSecret ?? '', $headerSecret)) {
            abort(401, 'Unauthorized.');
        }

        return $next($request);
    }
}
```

### How to Use in Routes

```php
// In routes/api/v1/internal.php
Route::middleware(['internal.webhook.secret', 'throttle:100,1'])
    ->prefix('internal')
    ->group(function () {
        // n8n polls this endpoint for reminders to send
        Route::get('bookings/due-reminders', DueRemindersController::class . '@index');

        // n8n POSTs back to this to confirm delivery
        Route::post('notifications/{id}/sent', NotificationCallbackController::class . '@sent');
        Route::post('notifications/{id}/failed', NotificationCallbackController::class . '@failed');
    });
```

---

## Middleware Registration in `Kernel.php`

### File Path

`backend/app/Http/Middleware/Kernel.php` (already exists, modify the `$routeMiddleware` array)

### Changes Needed

Add these three entries to the `$routeMiddleware` array (inside `Kernel` class):

```php
protected $routeMiddleware = [
    // ... existing middleware (auth, etc.) ...

    'role' => \App\Http\Middleware\EnsureUserHasRole::class,
    'subscription.active' => \App\Http\Middleware\EnsureSubscriptionActive::class,
    'internal.webhook.secret' => \App\Http\Middleware\VerifyInternalWebhookSecret::class,
];
```

### Verification

After registering, you can use them in routes as shown above:
```php
Route::middleware(['auth:sanctum', 'role:owner', 'subscription.active'])
```

---

## Seeder: `DemoBusinessSeeder`

### Purpose

Pre-populate local development database with realistic sample data:
- 1 demo business (barbershop) with 2 branches
- 4 staff members (barbers) assigned to branches
- 3 services (haircut, beard trim, full service)
- Staff working hours (weekdays 9 AM – 6 PM, closed Fridays)
- 5 sample customers
- 10 sample bookings (confirmed, completed, no-show, cancelled)

This allows manual testing of the full booking flow without creating everything by hand.

### File Path

`backend/database/seeders/DemoBusinessSeeder.php`

### Dependencies

Seeder depends on:
- `User` model (owner login)
- `Business`, `Branch`, `Staff`, `Service`, `Customer`, `Booking` models
- Enums: `UserRole`, `BookingStatus`, `BookingSource`

All these models and enums must exist **before** running the seeder.

### Code Structure — High Level

```
DemoBusinessSeeder
├── Create owner user (email: owner@demo.local, password: password)
├── Create business (name: "Demo Barbershop", slug: "demo-barbershop")
├── Create 2 branches (Cairo Main, Giza Branch)
├── Set branch working hours (9 AM – 6 PM, closed Fridays)
├── Create 4 staff members (Ahmed, Karim, Hassan, Omar)
├── Assign staff to branches
├── Set staff working hours per weekday
├── Create services (Haircut, Beard Trim, Full Service)
├── Link staff to services via staff_services pivot table
├── Create 5 customers (phone-based)
├── Create 10 sample bookings across different statuses
└── Log all credentials and sample data to console
```

### Sample Data Structure

**Owner Account:**
```
Email:    owner@demo.local
Password: password
Role:     owner
Business: Demo Barbershop
```

**Demo Business:**
```
Name:                 Demo Barbershop
Slug:                 demo-barbershop
Subscription Status:  trial
Subscription Expires: +30 days from today
```

**Branch 1: Cairo Main**
```
Address:        123 Zamalek Street, Cairo
WhatsApp:       +201001234567
Working Hours:  9:00 AM – 6:00 PM (closed Friday)
```

**Branch 2: Giza Branch**
```
Address:        456 Haram Street, Giza
WhatsApp:       +201001234568
Working Hours:  10:00 AM – 7:00 PM (closed Friday)
```

**Staff (Barbers):**
```
Ahmed (works Cairo Main)    — Haircut, Full Service
Karim (works Cairo Main)    — Beard Trim, Full Service
Hassan (works Giza Branch)  — Haircut, Beard Trim
Omar (works both branches)  — All services
```

**Services:**
```
Name:              Duration:    Price (EGP):
Haircut            30 min       50
Beard Trim         15 min       20
Full Service       60 min       100
```

**Sample Customers:**
```
Phone:              Name:
+201001111111      Mohammed
+201001111112      Fatima (weird but testing)
+201001111113      Ali
+201001111114      Sara
+201001111115      Hassan
```

**Sample Bookings:**
```
5 confirmed (upcoming)
3 completed (past)
1 no_show
1 cancelled
```

### Code Implementation

```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\BranchWorkingHour;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use App\Models\StaffWorkingHour;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoBusinessSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create owner user
        $owner = User::firstOrCreate(
            ['email' => 'owner@demo.local'],
            [
                'name' => 'Demo Owner',
                'password' => Hash::make('password'),
                'role' => UserRole::Owner,
                'is_active' => true,
            ],
        );

        // Create demo business
        $business = Business::firstOrCreate(
            ['slug' => 'demo-barbershop'],
            [
                'owner_user_id' => $owner->id,
                'name' => 'Demo Barbershop',
                'description' => 'A demonstration barbershop for testing the booking system.',
                'subscription_status' => 'trial',
                'subscription_expires_at' => now()->addDays(30),
            ],
        );

        // Attach owner to business
        $owner->update(['business_id' => $business->id]);

        // ─── BRANCHES ────────────────────────────────────────────────────
        $branch1 = Branch::firstOrCreate(
            ['business_id' => $business->id, 'slug' => 'cairo-main'],
            [
                'name' => 'Cairo Main',
                'address' => '123 Zamalek Street, Cairo',
                'city' => 'Cairo',
                'whatsapp_number' => '+201001234567',
                'is_active' => true,
            ],
        );

        $branch2 = Branch::firstOrCreate(
            ['business_id' => $business->id, 'slug' => 'giza-branch'],
            [
                'name' => 'Giza Branch',
                'address' => '456 Haram Street, Giza',
                'city' => 'Giza',
                'whatsapp_number' => '+201001234568',
                'is_active' => true,
            ],
        );

        // ─── BRANCH WORKING HOURS ────────────────────────────────────────
        // Cairo Main: 9 AM – 6 PM, closed Friday (5)
        for ($day = 0; $day < 7; $day++) {
            if ($day === 5) { // Friday
                BranchWorkingHour::firstOrCreate(
                    ['branch_id' => $branch1->id, 'weekday' => $day],
                    ['open_time' => null, 'close_time' => null],
                );
            } else {
                BranchWorkingHour::firstOrCreate(
                    ['branch_id' => $branch1->id, 'weekday' => $day],
                    ['open_time' => '09:00', 'close_time' => '18:00'],
                );
            }
        }

        // Giza Branch: 10 AM – 7 PM, closed Friday
        for ($day = 0; $day < 7; $day++) {
            if ($day === 5) {
                BranchWorkingHour::firstOrCreate(
                    ['branch_id' => $branch2->id, 'weekday' => $day],
                    ['open_time' => null, 'close_time' => null],
                );
            } else {
                BranchWorkingHour::firstOrCreate(
                    ['branch_id' => $branch2->id, 'weekday' => $day],
                    ['open_time' => '10:00', 'close_time' => '19:00'],
                );
            }
        }

        // ─── STAFF (Barbers) ──────────────────────────────────────────────
        $staffAhmed = Staff::firstOrCreate(
            ['business_id' => $business->id, 'name' => 'Ahmed'],
            [
                'branch_id' => $branch1->id,
                'user_id' => null, // Will set up login later if needed
                'is_active' => true,
            ],
        );

        $staffKarim = Staff::firstOrCreate(
            ['business_id' => $business->id, 'name' => 'Karim'],
            [
                'branch_id' => $branch1->id,
                'is_active' => true,
            ],
        );

        $staffHassan = Staff::firstOrCreate(
            ['business_id' => $business->id, 'name' => 'Hassan'],
            [
                'branch_id' => $branch2->id,
                'is_active' => true,
            ],
        );

        $staffOmar = Staff::firstOrCreate(
            ['business_id' => $business->id, 'name' => 'Omar'],
            [
                'branch_id' => $branch1->id,
                'is_active' => true,
            ],
        );

        // ─── STAFF WORKING HOURS ──────────────────────────────────────────
        // All staff work 9 AM – 6 PM, no days off (for simplicity)
        foreach ([$staffAhmed, $staffKarim, $staffHassan, $staffOmar] as $staff) {
            for ($day = 0; $day < 7; $day++) {
                if ($day === 5) { // Friday
                    StaffWorkingHour::firstOrCreate(
                        ['staff_id' => $staff->id, 'weekday' => $day],
                        ['start_time' => null, 'end_time' => null],
                    );
                } else {
                    StaffWorkingHour::firstOrCreate(
                        ['staff_id' => $staff->id, 'weekday' => $day],
                        ['start_time' => '09:00', 'end_time' => '18:00'],
                    );
                }
            }
        }

        // ─── SERVICES ──────────────────────────────────────────────────────
        $serviceHaircut = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch1->id, 'name' => 'Haircut'],
            [
                'duration_minutes' => 30,
                'price' => 50.00,
                'is_active' => true,
            ],
        );

        $serviceBeardTrim = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch1->id, 'name' => 'Beard Trim'],
            [
                'duration_minutes' => 15,
                'price' => 20.00,
                'is_active' => true,
            ],
        );

        $serviceFullService = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch1->id, 'name' => 'Full Service'],
            [
                'duration_minutes' => 60,
                'price' => 100.00,
                'is_active' => true,
            ],
        );

        // Create same services for branch 2
        $serviceHaircut2 = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch2->id, 'name' => 'Haircut'],
            [
                'duration_minutes' => 30,
                'price' => 50.00,
                'is_active' => true,
            ],
        );

        $serviceBeardTrim2 = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch2->id, 'name' => 'Beard Trim'],
            [
                'duration_minutes' => 15,
                'price' => 20.00,
                'is_active' => true,
            ],
        );

        $serviceFullService2 = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch2->id, 'name' => 'Full Service'],
            [
                'duration_minutes' => 60,
                'price' => 100.00,
                'is_active' => true,
            ],
        );

        // ─── STAFF-SERVICE PIVOT (who can perform what) ──────────────────
        // Branch 1 services
        $staffAhmed->services()->syncWithoutDetaching([$serviceHaircut->id, $serviceFullService->id]);
        $staffKarim->services()->syncWithoutDetaching([$serviceBeardTrim->id, $serviceFullService->id]);
        $staffOmar->services()->syncWithoutDetaching([
            $serviceHaircut->id,
            $serviceBeardTrim->id,
            $serviceFullService->id,
        ]);

        // Branch 2 services
        $staffHassan->services()->syncWithoutDetaching([
            $serviceHaircut2->id,
            $serviceBeardTrim2->id,
        ]);
        $staffOmar->services()->syncWithoutDetaching([
            $serviceHaircut2->id,
            $serviceBeardTrim2->id,
            $serviceFullService2->id,
        ]);

        // ─── CUSTOMERS ────────────────────────────────────────────────────
        $customers = [];
        $phoneNumbers = [
            '+201001111111' => 'Mohammed',
            '+201001111112' => 'Ali',
            '+201001111113' => 'Hassan',
            '+201001111114' => 'Sara',
            '+201001111115' => 'Fatima',
        ];

        foreach ($phoneNumbers as $phone => $name) {
            $customer = Customer::firstOrCreate(
                ['business_id' => $business->id, 'phone' => $phone],
                [
                    'name' => $name,
                    'otp_verified_at' => now(),
                ],
            );
            $customers[] = $customer;
        }

        // ─── SAMPLE BOOKINGS ──────────────────────────────────────────────
        $now = now('Africa/Cairo');

        // 5 confirmed (future)
        for ($i = 0; $i < 5; $i++) {
            $startsAt = $now->clone()->addDays(($i % 3) + 1)->setHour(10 + $i)->setMinute(0);
            $endsAt = $startsAt->clone()->addMinutes(30);

            Booking::firstOrCreate(
                [
                    'business_id' => $business->id,
                    'customer_id' => $customers[$i % count($customers)]->id,
                    'starts_at' => $startsAt,
                ],
                [
                    'branch_id' => $i % 2 === 0 ? $branch1->id : $branch2->id,
                    'service_id' => [$serviceHaircut->id, $serviceBeardTrim->id][$i % 2],
                    'staff_id' => [$staffAhmed->id, $staffKarim->id, $staffHassan->id][
                        $i % 3
                    ],
                    'ends_at' => $endsAt,
                    'status' => BookingStatus::Confirmed,
                    'source' => BookingSource::Online,
                ],
            );
        }

        // 3 completed (past)
        for ($i = 0; $i < 3; $i++) {
            $startsAt = $now->clone()->subDays(7 + $i)->setHour(11)->setMinute(0);
            $endsAt = $startsAt->clone()->addMinutes(30);

            Booking::firstOrCreate(
                [
                    'business_id' => $business->id,
                    'customer_id' => $customers[$i]->id,
                    'starts_at' => $startsAt,
                ],
                [
                    'branch_id' => $branch1->id,
                    'service_id' => $serviceHaircut->id,
                    'staff_id' => $staffAhmed->id,
                    'ends_at' => $endsAt,
                    'status' => BookingStatus::Completed,
                    'source' => BookingSource::Online,
                ],
            );
        }

        // 1 no-show
        $startsAt = $now->clone()->subDays(2)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(15);
        Booking::firstOrCreate(
            [
                'business_id' => $business->id,
                'customer_id' => $customers[3]->id,
                'starts_at' => $startsAt,
            ],
            [
                'branch_id' => $branch2->id,
                'service_id' => $serviceBeardTrim2->id,
                'staff_id' => $staffHassan->id,
                'ends_at' => $endsAt,
                'status' => BookingStatus::NoShow,
                'source' => BookingSource::Manual,
            ],
        );

        // 1 cancelled
        $startsAt = $now->clone()->subDays(1)->setHour(15)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(60);
        Booking::firstOrCreate(
            [
                'business_id' => $business->id,
                'customer_id' => $customers[4]->id,
                'starts_at' => $startsAt,
            ],
            [
                'branch_id' => $branch1->id,
                'service_id' => $serviceFullService->id,
                'staff_id' => $staffOmar->id,
                'ends_at' => $endsAt,
                'status' => BookingStatus::Cancelled,
                'source' => BookingSource::Online,
            ],
        );

        // ─── LOG CREDENTIALS ──────────────────────────────────────────────
        $this->command->info('
╔════════════════════════════════════════════════════════════════╗
║             Demo Data Seeded Successfully                       ║
╚════════════════════════════════════════════════════════════════╝

🏢 BUSINESS:
   Name:        Demo Barbershop
   Slug:        demo-barbershop
   Branches:    Cairo Main, Giza Branch
   Subscription: Trial (expires ' . $business->subscription_expires_at->toDateString() . ')

👤 OWNER LOGIN:
   Email:       owner@demo.local
   Password:    password
   Business ID: ' . $business->id . '

💈 STAFF (Barbers):
   Ahmed  (Cairo Main)   → Haircut, Full Service
   Karim  (Cairo Main)   → Beard Trim, Full Service
   Hassan (Giza Branch)  → Haircut, Beard Trim
   Omar   (Cairo Main)   → All Services

🛎️  SERVICES:
   Haircut (30 min, 50 EGP)
   Beard Trim (15 min, 20 EGP)
   Full Service (60 min, 100 EGP)

👥 CUSTOMERS:
   5 sample customers created with phone-based accounts

📅 BOOKINGS:
   5 Confirmed (upcoming)
   3 Completed (past)
   1 No-Show
   1 Cancelled

🔍 NEXT STEPS:
   1. Login at /api/v1/auth/login with owner@demo.local / password
   2. Test booking flow at /book/demo-barbershop/cairo-main
   3. View calendar at dashboard /calendar
        ');
    }
}
```

---

## How to Run the Seeder

### First Run (Fresh Database)

```bash
cd backend

# Option 1: Run fresh migrations + seed
php artisan migrate:fresh --seed

# Option 2: Seed only (if migrations already ran)
php artisan db:seed --class=DemoBusinessSeeder
```

### Reset Demo Data (Keep Schema)

```bash
cd backend

# Delete all demo data and re-run seeder
php artisan db:seed --class=DemoBusinessSeeder
```

### Delete All Demo Data (Keep Schema)

```bash
cd backend

# If you need to clear the DB without re-running seeders
php artisan tinker

# Then in tinker:
>>> DB::statement('TRUNCATE TABLE bookings');
>>> DB::statement('TRUNCATE TABLE notifications_log');
>>> DB::statement('TRUNCATE TABLE staff_services');
>>> DB::statement('TRUNCATE TABLE staff_working_hours');
>>> DB::statement('TRUNCATE TABLE staff');
>>> DB::statement('TRUNCATE TABLE services');
>>> DB::statement('TRUNCATE TABLE customers');
>>> DB::statement('TRUNCATE TABLE branch_working_hours');
>>> DB::statement('TRUNCATE TABLE branches');
>>> DB::statement('TRUNCATE TABLE businesses');
>>> DB::statement('TRUNCATE TABLE users WHERE role != "admin"');
>>> exit
```

---

## Register Seeder in `DatabaseSeeder`

### File Path

`backend/database/seeders/DatabaseSeeder.php`

### Modification

Open the file and modify the `run()` method:

```php
public function run(): void
{
    // Run demo seeder only in local environment
    if ($this->command->confirm('Seed demo data?', true)) {
        $this->call(DemoBusinessSeeder::class);
    }
}
```

When you run `php artisan migrate:fresh --seed`, it will ask you if you want to seed demo data.
Answer `y` to run the `DemoBusinessSeeder`, or `n` to skip.

---

## Configuration: Store Webhook Secret in `config/services.php`

### File Path

`backend/config/services.php`

### Add This Section

```php
<?php

return [
    // ... existing services ...

    'internal_webhook_secret' => env('INTERNAL_WEBHOOK_SECRET'),

    // ... rest of services ...
];
```

This lets `VerifyInternalWebhookSecret` middleware read the secret from config instead of directly from `.env`.

---

## Testing the Middleware

### Test 1: `EnsureUserHasRole`

```bash
# Create a test owner and staff user
php artisan tinker
>>> $owner = User::create(['email' => 'test@owner', 'role' => 'owner', 'business_id' => 1, 'password' => bcrypt('test')]);
>>> $owner->createToken('test')->plainTextToken
# Copy the token and test:

# With owner token on owner route — should pass (200)
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/owner/branches

# With owner token on staff route — should fail (403)
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/staff/schedule

# No token on protected route — should fail (401)
curl http://localhost:8000/api/v1/owner/branches
```

### Test 2: `EnsureSubscriptionActive`

```bash
# Expire the demo business subscription
php artisan tinker
>>> $business = Business::first();
>>> $business->update(['subscription_expires_at' => now()->subDays(1)]);

# Now try to access owner route with owner token — should fail (403)
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/v1/owner/branches

# Public booking should still work
curl http://localhost:8000/api/v1/public/bookings
```

### Test 3: `VerifyInternalWebhookSecret`

```bash
# With correct secret header — should pass (200)
curl -H "X-Internal-Secret: your_secret_from_env" \
     http://localhost:8000/api/v1/internal/bookings/due-reminders

# With wrong secret — should fail (401)
curl -H "X-Internal-Secret: wrong_secret" \
     http://localhost:8000/api/v1/internal/bookings/due-reminders

# No secret header — should fail (401)
curl http://localhost:8000/api/v1/internal/bookings/due-reminders
```

---

## Checklist Before Moving to Feature Development

- [ ] All three middleware classes created in `app/Http/Middleware/`
- [ ] All three middleware registered in `Kernel.php` `$routeMiddleware` array
- [ ] `DemoBusinessSeeder` created in `database/seeders/`
- [ ] `DatabaseSeeder.php` modified to call `DemoBusinessSeeder`
- [ ] `config/services.php` updated with `internal_webhook_secret`
- [ ] `.env` has `INTERNAL_WEBHOOK_SECRET` set to a strong random value
- [ ] `php artisan migrate:fresh --seed` runs cleanly with demo data
- [ ] Owner can log in with `owner@demo.local` / `password`
- [ ] All three middleware tested (see Testing section above)
- [ ] Demo business visible in admin panel with correct subscription status

After this checklist is complete, you can move forward with Feature development without worrying about auth/subscription/webhook boundaries.