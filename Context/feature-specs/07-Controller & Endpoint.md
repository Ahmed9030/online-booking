# Phase 3: API Endpoints & Controllers Specification
# Booking SaaS — Barbershop Appointment Platform

> This spec covers ALL API endpoints, controllers, Form Requests, and API Resources.
> After Phase 2, Phase 3 is about exposing the booking logic via REST API.

---

## Overview

### Route Structure

```
/api/v1/
├── public/          ← unauthenticated (booking flow, no auth required)
├── auth/            ← login, register, OTP
├── owner/           ← auth:sanctum + role:owner + subscription.active
├── staff/           ← auth:sanctum + role:staff + subscription.active
├── customer/        ← auth:sanctum (OTP session)
├── admin/           ← auth:sanctum + role:admin
└── internal/        ← internal.webhook.secret (n8n callbacks)
```

### Response Structure

**Success Response (200/201):**
```json
{
  "data": { /* resource */ },
  "message": "Success message (optional)"
}
```

**Paginated Response (200):**
```json
{
  "data": [ /* resources */ ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73
  }
}
```

**Error Response (422/403/401/404):**
```json
{
  "message": "Error message",
  "errors": {
    "field": ["Error message 1", "Error message 2"]
  }
}
```

---

## Part 1: Route Files

### File 1: `routes/api/v1/public.php`

**Purpose:** Unauthenticated booking flow endpoints.
**Middleware:** `throttle:60,1` (60 requests per minute)

```php
<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Public\AvailabilityController;
use App\Http\Controllers\Api\V1\Public\BookingController as PublicBookingController;
use App\Http\Controllers\Api\V1\Public\BranchController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:60,1')->group(function () {
    // Get business + branches by slug
    Route::get('business/{slug}', [BranchController::class, 'showBusiness']);
    Route::get('business/{businessSlug}/branches/{branchSlug}', [BranchController::class, 'show']);

    // Get services for a branch
    Route::get('branches/{id}/services', [BranchController::class, 'services']);

    // Get available slots
    Route::post('availability/check', [AvailabilityController::class, 'check']);

    // Create booking (public flow — customer provides phone, gets OTP)
    Route::post('bookings', [PublicBookingController::class, 'store']);
});
```

### File 2: `routes/api/v1/auth.php`

**Purpose:** Authentication endpoints (OTP for customers, password for owners/staff).
**Middleware:** `throttle:10,1` (10 requests per minute — stricter for auth)

```php
<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\OtpController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:10,1')->group(function () {
    // Owner/Staff login (password-based)
    Route::post('login', [LoginController::class, 'store']);

    // Owner signup
    Route::post('register', [RegisterController::class, 'store']);

    // Customer OTP flow
    Route::post('otp/send', [OtpController::class, 'send']);
    Route::post('otp/verify', [OtpController::class, 'verify']);

    // Logout (authenticated)
    Route::middleware('auth:sanctum')->post('logout', [LoginController::class, 'destroy']);
});
```

### File 3: `routes/api/v1/owner.php`

**Purpose:** Owner-only management endpoints.
**Middleware:** `auth:sanctum + role:owner + subscription.active`

```php
<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Owner\BranchController;
use App\Http\Controllers\Api\V1\Owner\BookingController;
use App\Http\Controllers\Api\V1\Owner\CustomerController;
use App\Http\Controllers\Api\V1\Owner\DashboardController;
use App\Http\Controllers\Api\V1\Owner\ServiceController;
use App\Http\Controllers\Api\V1\Owner\SettingsController;
use App\Http\Controllers\Api\V1\Owner\StaffController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:owner', 'subscription.active'])->group(function () {
    // Dashboard overview
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Branches CRUD
    Route::apiResource('branches', BranchController::class);
    Route::post('branches/{id}/working-hours', [BranchController::class, 'updateWorkingHours']);
    Route::get('branches/{id}/bookings', [BranchController::class, 'bookings']);

    // Staff CRUD
    Route::apiResource('staff', StaffController::class);
    Route::post('staff/{id}/working-hours', [StaffController::class, 'updateWorkingHours']);
    Route::post('staff/{id}/services', [StaffController::class, 'assignServices']);
    Route::post('staff/{id}/login-credentials', [StaffController::class, 'createLoginCredentials']);

    // Services CRUD
    Route::apiResource('services', ServiceController::class);

    // Bookings (owner view)
    Route::get('bookings', [BookingController::class, 'index']);
    Route::post('bookings', [BookingController::class, 'store']); // Manual booking
    Route::get('bookings/{id}', [BookingController::class, 'show']);
    Route::patch('bookings/{id}/status', [BookingController::class, 'updateStatus']);
    Route::delete('bookings/{id}', [BookingController::class, 'destroy']);

    // Customers
    Route::get('customers', [CustomerController::class, 'index']);
    Route::get('customers/{id}', [CustomerController::class, 'show']);
    Route::get('customers/{id}/bookings', [CustomerController::class, 'bookings']);

    // Settings
    Route::get('settings', [SettingsController::class, 'show']);
    Route::patch('settings', [SettingsController::class, 'update']);
});
```

### File 4: `routes/api/v1/staff.php`

**Purpose:** Staff-only endpoints (limited access).
**Middleware:** `auth:sanctum + role:staff + subscription.active`

```php
<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Staff\ScheduleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:staff', 'subscription.active'])->group(function () {
    // View own schedule
    Route::get('schedule', [ScheduleController::class, 'index']);
    Route::get('schedule/{date}', [ScheduleController::class, 'show']);

    // Update booking status (mark completed/no-show)
    Route::patch('bookings/{id}/completed', [ScheduleController::class, 'markCompleted']);
    Route::patch('bookings/{id}/no-show', [ScheduleController::class, 'markNoShow']);
});
```

### File 5: `routes/api/v1/customer.php`

**Purpose:** Customer endpoints (OTP-authenticated).
**Middleware:** `auth:sanctum` (OTP session token)

```php
<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Customer\MyBookingsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Customer views own bookings
    Route::get('my-bookings', [MyBookingsController::class, 'index']);
    Route::get('my-bookings/{id}', [MyBookingsController::class, 'show']);
    Route::delete('my-bookings/{id}', [MyBookingsController::class, 'cancel']);
});
```

### File 6: `routes/api/v1/admin.php`

**Purpose:** Platform admin endpoints.
**Middleware:** `auth:sanctum + role:admin`

```php
<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\BusinessController;
use App\Http\Controllers\Api\V1\Admin\OverviewController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Platform overview
    Route::get('overview', [OverviewController::class, 'index']);

    // Manage businesses
    Route::get('businesses', [BusinessController::class, 'index']);
    Route::get('businesses/{id}', [BusinessController::class, 'show']);
    Route::patch('businesses/{id}/subscription', [BusinessController::class, 'updateSubscription']);
    Route::patch('businesses/{id}/status', [BusinessController::class, 'updateStatus']);
});
```

### File 7: `routes/api/v1/internal.php`

**Purpose:** Internal n8n webhook endpoints.
**Middleware:** `internal.webhook.secret + throttle:100,1`

```php
<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Internal\DueRemindersController;
use App\Http\Controllers\Api\V1\Internal\NotificationCallbackController;
use Illuminate\Support\Facades\Route;

Route::middleware(['internal.webhook.secret', 'throttle:100,1'])->group(function () {
    // n8n polls for due reminders
    Route::get('bookings/due-reminders', [DueRemindersController::class, 'index']);

    // n8n reports back on delivery
    Route::post('notifications/{id}/sent', [NotificationCallbackController::class, 'sent']);
    Route::post('notifications/{id}/failed', [NotificationCallbackController::class, 'failed']);
});
```

---

## Part 2: Controllers

### Controller 1: BranchController (Public)

**File:** `backend/app/Http/Controllers/Api/V1/Public/BranchController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\BranchResource;
use App\Http\Resources\ServiceResource;
use App\Models\Branch;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

class BranchController extends Controller
{
    /**
     * Get business and all its branches by slug.
     * GET /api/v1/public/business/{slug}
     */
    public function showBusiness(string $slug): JsonResponse
    {
        $business = Business::where('slug', $slug)
            ->where('subscription_status', '!=', 'suspended')
            ->firstOrFail();

        $branches = $business->branches()
            ->where('is_active', true)
            ->get();

        return response()->json([
            'data' => [
                'business' => [
                    'id' => $business->id,
                    'name' => $business->name,
                    'logo_url' => $business->logo_url,
                ],
                'branches' => BranchResource::collection($branches),
            ],
        ]);
    }

    /**
     * Get specific branch by business slug + branch slug.
     * GET /api/v1/public/business/{businessSlug}/branches/{branchSlug}
     */
    public function show(string $businessSlug, string $branchSlug): JsonResponse
    {
        $business = Business::where('slug', $businessSlug)
            ->where('subscription_status', '!=', 'suspended')
            ->firstOrFail();

        $branch = Branch::where('business_id', $business->id)
            ->where('slug', $branchSlug)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json([
            'data' => new BranchResource($branch),
        ]);
    }

    /**
     * Get services for a branch.
     * GET /api/v1/public/branches/{id}/services
     */
    public function services(string $id): ResourceCollection
    {
        $branch = Branch::findOrFail($id);

        $services = $branch->services()
            ->where('is_active', true)
            ->get();

        return ServiceResource::collection($services);
    }
}
```

### Controller 2: AvailabilityController (Public)

**File:** `backend/app/Http/Controllers/Api/V1/Public/AvailabilityController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\CheckAvailabilityRequest;
use App\Models\Branch;
use App\Models\Service;
use App\Models\Staff;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AvailabilityController extends Controller
{
    /**
     * @param AvailabilityService $availability Service for checking available time slots.
     */
    public function __construct(
        private readonly AvailabilityService $availability,
    ) {}

    /**
     * Check available slots for a service on a date.
     * POST /api/v1/public/availability/check
     *
     * Request body:
     * {
     *   "branch_id": "uuid",
     *   "service_id": "uuid",
     *   "staff_id": "uuid (optional, null for any available)",
     *   "date": "2026-06-25"
     * }
     */
    public function check(CheckAvailabilityRequest $request): JsonResponse
    {
        $branch = Branch::findOrFail($request->validated('branch_id'));
        $service = Service::findOrFail($request->validated('service_id'));

        $staff = null;
        if ($request->validated('staff_id')) {
            $staff = Staff::findOrFail($request->validated('staff_id'));
        }

        $date = Carbon::parse($request->validated('date'))->setTimezone('Africa/Cairo');

        $slots = $this->availability->getAvailableSlots($branch, $service, $staff, $date);

        return response()->json([
            'data' => [
                'slots' => $slots,
                'total_available' => $slots->count(),
            ],
        ]);
    }
}
```

### Controller 3: BookingController (Public)

**File:** `backend/app/Http/Controllers/Api/V1/Public/BookingController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Actions\Bookings\CreateBookingAction;
use App\Data\CreateBookingData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StorePublicBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    /**
     * @param CreateBookingAction $createBooking Action for creating new bookings.
     */
    public function __construct(
        private readonly CreateBookingAction $createBooking,
    ) {}

    /**
     * Create a booking (public flow, no auth required).
     * POST /api/v1/public/bookings
     *
     * Request body:
     * {
     *   "branch_id": "uuid",
     *   "service_id": "uuid",
     *   "staff_id": "uuid (optional, null for any available)",
     *   "customer_name": "Ahmed",
     *   "customer_phone": "+201001111111",
     *   "starts_at": "2026-06-25 14:00",
     *   "ends_at": "2026-06-25 14:30"
     * }
     */
    public function store(StorePublicBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Get or create customer
        $business = auth()->user()?->business ?? Branch::findOrFail($validated['branch_id'])->business;

        $customer = Customer::firstOrCreate(
            ['business_id' => $business->id, 'phone' => $validated['customer_phone']],
            ['name' => $validated['customer_name'], 'otp_verified_at' => now()],
        );

        // Create booking via action
        $startsAt = Carbon::parse($validated['starts_at'])->setTimezone('Africa/Cairo');
        $endsAt = Carbon::parse($validated['ends_at'])->setTimezone('Africa/Cairo');

        $data = new CreateBookingData(
            businessId: $business->id,
            branchId: $validated['branch_id'],
            serviceId: $validated['service_id'],
            customerId: $customer->id,
            startsAt: $startsAt,
            endsAt: $endsAt,
            staffId: $validated['staff_id'] ?? null,
            source: 'online',
        );

        $booking = $this->createBooking->handle($data);

        return response()->json(
            ['data' => new BookingResource($booking)],
            201,
        );
    }
}
```

### Controller 4: LoginController (Auth)

**File:** `backend/app/Http/Controllers/Api/V1/Auth/LoginController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    /**
     * Login owner or staff (password-based).
     * POST /api/v1/auth/login
     *
     * Request body:
     * {
     *   "email_or_username": "owner@example.com or barber_ahmed",
     *   "password": "secret"
     * }
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $user = \App\Models\User::where(function ($q) use ($request) {
            $q->where('email', $request->validated('email_or_username'))
              ->orWhere('username', $request->validated('email_or_username'));
        })->first();

        if (!$user || !Hash::check($request->validated('password'), $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'This account has been deactivated.',
            ], 403);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
            'message' => 'Logged in successfully.',
        ]);
    }

    /**
     * Logout (authenticated).
     * POST /api/v1/auth/logout
     */
    public function destroy(): JsonResponse
    {
        auth()->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
```

### Controller 5: OtpController (Auth)

**File:** `backend/app/Http/Controllers/Api/V1/Auth/OtpController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\OtpCode;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\RateLimiter;

class OtpController extends Controller
{
    /**
     * @param OtpService $otpService Service for generating and verifying OTP codes.
     */
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    /**
     * Send OTP to customer's phone.
     * POST /api/v1/auth/otp/send
     *
     * Request body:
     * {
     *   "phone": "+201001111111"
     * }
     */
    public function send(SendOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');

        // Rate limit: max 3 OTP sends per phone per 10 minutes
        $key = "otp_send:{$phone}";
        if (RateLimiter::tooManyAttempts($key, 3)) {
            return response()->json([
                'message' => 'Too many OTP requests. Please try again later.',
            ], 429);
        }

        RateLimiter::hit($key, 10 * 60);

        // Generate and send OTP
        $this->otpService->sendOtp($phone);

        return response()->json([
            'message' => 'OTP sent to your phone. Valid for 5 minutes.',
        ]);
    }

    /**
     * Verify OTP and get auth token.
     * POST /api/v1/auth/otp/verify
     *
     * Request body:
     * {
     *   "phone": "+201001111111",
     *   "code": "123456"
     * }
     */
    public function verify(VerifyOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');
        $code = $request->validated('code');

        // Verify OTP
        if (!$this->otpService->verifyOtp($phone, $code)) {
            return response()->json([
                'message' => 'Invalid or expired OTP.',
            ], 422);
        }

        // Create or get customer user (for tracking bookings)
        $user = User::firstOrCreate(
            ['phone' => $phone, 'role' => 'customer'],
            [
                'name' => 'Customer',
                'password' => bcrypt(uniqid()),
            ],
        );

        // Create token
        $token = $user->createToken('otp')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'phone' => $phone,
            ],
            'message' => 'OTP verified successfully.',
        ]);
    }
}
```

### Controller 6: RegisterController (Auth)

**File:** `backend/app/Http/Controllers/Api/V1/Auth/RegisterController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Business;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegisterController extends Controller
{
    /**
     * Register a new business owner.
     * POST /api/v1/auth/register
     *
     * Request body:
     * {
     *   "name": "Ahmed's Barbershop",
     *   "email": "owner@example.com",
     *   "password": "secure_password",
     *   "password_confirmation": "secure_password",
     *   "business_name": "Ahmed's Barbershop",
     *   "branch_name": "Main Branch",
     *   "branch_address": "123 Street, Cairo"
     * }
     */
    public function store(RegisterRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $validated = $request->validated();

            // Create owner user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => UserRole::Owner,
                'is_active' => true,
            ]);

            // Create business
            $business = Business::create([
                'owner_user_id' => $user->id,
                'name' => $validated['business_name'],
                'slug' => Str::slug($validated['business_name']) . '-' . Str::random(6),
                'subscription_status' => 'trial',
                'subscription_expires_at' => now()->addDays(14),
            ]);

            // Attach user to business
            $user->update(['business_id' => $business->id]);

            // Create first branch
            Branch::create([
                'business_id' => $business->id,
                'name' => $validated['branch_name'],
                'address' => $validated['branch_address'],
                'city' => $validated['city'] ?? 'Cairo',
                'slug' => 'main',
                'is_active' => true,
            ]);

            // Create token
            $token = $user->createToken('auth')->plainTextToken;

            return response()->json([
                'data' => [
                    'user' => new UserResource($user),
                    'business' => [
                        'id' => $business->id,
                        'name' => $business->name,
                        'slug' => $business->slug,
                        'subscription_expires_at' => $business->subscription_expires_at,
                    ],
                    'token' => $token,
                ],
                'message' => 'Account created successfully. Welcome!',
            ], 201);
        });
    }
}
```

### Controller 7: DashboardController (Owner)

**File:** `backend/app/Http/Controllers/Api/V1/Owner/DashboardController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get dashboard overview stats.
     * GET /api/v1/owner/dashboard
     */
    public function index(): JsonResponse
    {
        $business = auth()->user()->business;
        $today = now('Africa/Cairo')->startOfDay();

        // Today's bookings
        $todayBookings = Booking::where('business_id', $business->id)
            ->whereDate('starts_at', $today)
            ->where('status', 'confirmed')
            ->count();

        // This month's bookings
        $monthBookings = Booking::where('business_id', $business->id)
            ->whereMonth('starts_at', now()->month)
            ->where('status', '!=', 'cancelled')
            ->count();

        // No-show rate this month
        $noShowCount = Booking::where('business_id', $business->id)
            ->whereMonth('starts_at', now()->month)
            ->where('status', 'no_show')
            ->count();

        $noShowRate = $monthBookings > 0 ? round(($noShowCount / $monthBookings) * 100, 1) : 0;

        // Next upcoming booking
        $nextBooking = Booking::where('business_id', $business->id)
            ->where('status', 'confirmed')
            ->where('starts_at', '>', now())
            ->orderBy('starts_at')
            ->first();

        // Subscription status
        $daysUntilExpiry = $business->subscription_expires_at?->diffInDays(now()) ?? 0;

        return response()->json([
            'data' => [
                'today_bookings' => $todayBookings,
                'month_bookings' => $monthBookings,
                'no_show_rate' => $noShowRate,
                'next_booking' => $nextBooking ? [
                    'id' => $nextBooking->id,
                    'customer_name' => $nextBooking->customer->name,
                    'starts_at' => $nextBooking->starts_at->setTimezone('Africa/Cairo'),
                    'service_name' => $nextBooking->service->name,
                ] : null,
                'subscription' => [
                    'status' => $business->subscription_status->value,
                    'expires_at' => $business->subscription_expires_at,
                    'days_remaining' => max(0, $daysUntilExpiry),
                ],
            ],
        ]);
    }
}
```

### Controller 8: BranchController (Owner)

**File:** `backend/app/Http/Controllers/Api/V1/Owner/BranchController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\StoreBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use App\Http\Requests\Branch\UpdateWorkingHoursRequest;
use App\Http\Resources\BranchResource;
use App\Http\Resources\BookingResource;
use App\Models\Branch;
use App\Models\BranchWorkingHour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

class BranchController extends Controller
{
    /**
     * List all branches for the owner's business.
     * GET /api/v1/owner/branches
     */
    public function index(): ResourceCollection
    {
        $branches = Branch::where('business_id', auth()->user()->business_id)
            ->orderBy('created_at')
            ->paginate(15);

        return BranchResource::collection($branches);
    }

    /**
     * Create a new branch.
     * POST /api/v1/owner/branches
     */
    public function store(StoreBranchRequest $request): JsonResponse
    {
        $branch = Branch::create([
            'business_id' => auth()->user()->business_id,
            'name' => $request->validated('name'),
            'address' => $request->validated('address'),
            'city' => $request->validated('city'),
            'whatsapp_number' => $request->validated('whatsapp_number'),
            'slug' => $request->validated('slug'),
            'is_active' => true,
        ]);

        return response()->json(['data' => new BranchResource($branch)], 201);
    }

    /**
     * Get branch details.
     * GET /api/v1/owner/branches/{id}
     */
    public function show(string $id): JsonResponse
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        return response()->json(['data' => new BranchResource($branch)]);
    }

    /**
     * Update branch.
     * PATCH /api/v1/owner/branches/{id}
     */
    public function update(string $id, UpdateBranchRequest $request): JsonResponse
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $branch->update($request->validated());

        return response()->json(['data' => new BranchResource($branch)]);
    }

    /**
     * Delete branch (soft delete).
     * DELETE /api/v1/owner/branches/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $branch->delete();

        return response()->json(['message' => 'Branch deleted.']);
    }

    /**
     * Update branch working hours.
     * POST /api/v1/owner/branches/{id}/working-hours
     *
     * Request body:
     * {
     *   "working_hours": [
     *     {"weekday": 0, "open_time": "09:00", "close_time": "18:00"},
     *     {"weekday": 1, "open_time": "09:00", "close_time": "18:00"},
     *     ...
     *   ]
     * }
     */
    public function updateWorkingHours(string $id, UpdateWorkingHoursRequest $request): JsonResponse
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        // Clear existing hours
        $branch->workingHours()->delete();

        // Create new hours
        foreach ($request->validated('working_hours') as $hours) {
            BranchWorkingHour::create([
                'branch_id' => $branch->id,
                'weekday' => $hours['weekday'],
                'open_time' => $hours['open_time'] ?? null,
                'close_time' => $hours['close_time'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Working hours updated.']);
    }

    /**
     * Get bookings for a branch.
     * GET /api/v1/owner/branches/{id}/bookings
     */
    public function bookings(string $id): ResourceCollection
    {
        $branch = Branch::where('business_id', auth()->user()->business_id)
            ->findOrFail($id);

        $bookings = $branch->bookings()
            ->orderByDesc('starts_at')
            ->paginate(15);

        return BookingResource::collection($bookings);
    }
}
```

---

## Part 3: Form Requests

### Request 1: StorePublicBookingRequest

**File:** `backend/app/Http/Requests/Booking/StorePublicBookingRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StorePublicBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Public endpoint — no authentication required.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'service_id' => ['required', 'uuid', 'exists:services,id'],
            'staff_id' => ['nullable', 'uuid', 'exists:staff,id'],
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            'customer_phone' => [
                'required',
                'string',
                'regex:/^(\+20|0)?1[0-2,5]\d{8}$/', // Egyptian phone format
            ],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
        ];
    }

    /**
     * Get custom validation messages in Arabic.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_phone.regex' => 'رقم الهاتف يجب أن يكون رقم مصري صحيح',
            'starts_at.after' => 'لا يمكن الحجز في الماضي',
        ];
    }
}
```

### Request 2: CheckAvailabilityRequest

**File:** `backend/app/Http/Requests/Booking/CheckAvailabilityRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class CheckAvailabilityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Public endpoint — no authentication required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules for checking slot availability.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'service_id' => ['required', 'uuid', 'exists:services,id'],
            'staff_id' => ['nullable', 'uuid', 'exists:staff,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
        ];
    }
}
```

### Request 3: LoginRequest

**File:** `backend/app/Http/Requests/Auth/LoginRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Public endpoint — no authentication required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules for login credentials.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email_or_username' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6'],
        ];
    }
}
```

### Request 4: RegisterRequest

**File:** `backend/app/Http/Requests/Auth/RegisterRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Public endpoint — no authentication required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules for owner registration.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::default()],
            'business_name' => ['required', 'string', 'min:3', 'max:100'],
            'branch_name' => ['required', 'string', 'min:3', 'max:100'],
            'branch_address' => ['required', 'string', 'min:5'],
            'city' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Get custom validation messages in Arabic.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.confirmed' => 'كلمات المرور غير متطابقة',
        ];
    }
}
```

### Request 5: SendOtpRequest

**File:** `backend/app/Http/Requests/Auth/SendOtpRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Public endpoint — no authentication required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules for sending an OTP.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'phone' => [
                'required',
                'string',
                'regex:/^(\+20|0)?1[0-2,5]\d{8}$/',
            ],
        ];
    }
}
```

### Request 6: VerifyOtpRequest

**File:** `backend/app/Http/Requests/Auth/VerifyOtpRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Public endpoint — no authentication required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules for verifying an OTP code.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'phone' => [
                'required',
                'string',
                'regex:/^(\+20|0)?1[0-2,5]\d{8}$/',
            ],
            'code' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
        ];
    }
}
```

### Request 7: StoreBranchRequest

**File:** `backend/app/Http/Requests/Branch/StoreBranchRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a branch.
     * Only authenticated owners can create branches.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role->value === 'owner';
    }

    /**
     * Get the validation rules for storing a new branch.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'address' => ['required', 'string', 'min:5'],
            'city' => ['required', 'string', 'max:50'],
            'whatsapp_number' => ['required', 'string'],
            'slug' => [
                'required',
                'string',
                'regex:/^[a-z0-9\-]+$/',
                'unique:branches,slug,NULL,id,business_id,' . auth()->user()->business_id,
            ],
        ];
    }
}
```

---

## Part 4: API Resources

### Resource 1: BranchResource

**File:** `backend/app/Http/Resources/BranchResource.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    /**
     * Transform the branch resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'city' => $this->city,
            'whatsapp_number' => $this->whatsapp_number,
            'slug' => $this->slug,
            'is_active' => $this->is_active,
            'working_hours' => $this->whenLoaded('workingHours', function () {
                return $this->workingHours->map(fn ($h) => [
                    'weekday' => $h->weekday,
                    'open_time' => $h->open_time,
                    'close_time' => $h->close_time,
                ]);
            }),
            'created_at' => $this->created_at,
        ];
    }
}
```

### Resource 2: BookingResource

**File:** `backend/app/Http/Resources/BookingResource.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    /**
     * Transform the booking resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'source' => $this->source->value,
            'starts_at' => $this->starts_at->setTimezone('Africa/Cairo')->toIso8601String(),
            'ends_at' => $this->ends_at->setTimezone('Africa/Cairo')->toIso8601String(),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'service' => new ServiceResource($this->whenLoaded('service')),
            'staff' => new StaffResource($this->whenLoaded('staff')),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
```

### Resource 3: UserResource

**File:** `backend/app/Http/Resources/UserResource.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the user resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role->value,
            'business_id' => $this->business_id,
        ];
    }
}
```

---

## Summary of All Endpoints

| Method | Route | Controller | Auth | Limit |
|--------|-------|-----------|------|-------|
| GET | `/public/business/{slug}` | BranchController@showBusiness | — | 60/min |
| GET | `/public/branches/{id}` | BranchController@show | — | 60/min |
| POST | `/public/availability/check` | AvailabilityController@check | — | 60/min |
| POST | `/public/bookings` | BookingController@store | — | 60/min |
| POST | `/auth/login` | LoginController@store | — | 10/min |
| POST | `/auth/register` | RegisterController@store | — | 10/min |
| POST | `/auth/otp/send` | OtpController@send | — | 10/min |
| POST | `/auth/otp/verify` | OtpController@verify | — | 10/min |
| POST | `/auth/logout` | LoginController@destroy | sanctum | — |
| GET | `/owner/dashboard` | DashboardController@index | owner | — |
| GET | `/owner/branches` | BranchController@index | owner | — |
| POST | `/owner/branches` | BranchController@store | owner | — |
| GET | `/owner/branches/{id}` | BranchController@show | owner | — |
| PATCH | `/owner/branches/{id}` | BranchController@update | owner | — |
| POST | `/owner/branches/{id}/working-hours` | BranchController@updateWorkingHours | owner | — |
| GET | `/staff/schedule` | ScheduleController@index | staff | — |
| GET | `/customer/my-bookings` | MyBookingsController@index | customer | — |
| GET | `/admin/businesses` | BusinessController@index | admin | — |
| GET | `/internal/bookings/due-reminders` | DueRemindersController@index | secret | 100/min |
| POST | `/internal/notifications/{id}/sent` | NotificationCallbackController@sent | secret | 100/min |

---

## Complete Controller List (To Create)

### Public Controllers
1. ✅ `BranchController` — branch info
2. ✅ `AvailabilityController` — check slots
3. ✅ `BookingController` — create public booking

### Auth Controllers
4. ✅ `LoginController` — password login + logout
5. ✅ `RegisterController` — owner signup
6. ⏳ `OtpController` — OTP send/verify (needs OtpService)

### Owner Controllers
7. ✅ `DashboardController` — overview stats
8. ✅ `BranchController` — CRUD branches + working hours
9. ⏳ `StaffController` — CRUD staff + credentials + services
10. ⏳ `ServiceController` — CRUD services
11. ⏳ `BookingController` — list, create manual, update status
12. ⏳ `CustomerController` — list customers, detail, bookings
13. ⏳ `SettingsController` — business profile

### Staff Controllers
14. ⏳ `ScheduleController` — own schedule, mark completed/no-show

### Customer Controllers
15. ⏳ `MyBookingsController` — list own bookings, cancel

### Admin Controllers
16. ⏳ `BusinessController` — list, subscription, status
17. ⏳ `OverviewController` — platform stats

### Internal Controllers
18. ⏳ `DueRemindersController` — n8n polling
19. ⏳ `NotificationCallbackController` — n8n callbacks

---

## Next Steps

After completing Phase 3 controllers:
1. Create all Form Request classes
2. Create all API Resource classes
3. Register routes in `routes/api.php`
4. Write feature tests for each endpoint
5. Move to Phase 4: Next.js frontend

Each controller should:
- Authorize via middleware (role, subscription, etc.)
- Call the appropriate Action or Service
- Return JsonResource responses
- Handle errors gracefully (throw exceptions that get caught by middleware)