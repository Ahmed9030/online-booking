# Architecture Context
# Booking SaaS — Barbershop Appointment Platform

> This file is the single source of truth for architecture decisions.
> Before generating any code, the AI must read the relevant section here
> to understand where new code belongs and why it's designed that way.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│  Next.js (App Router, TypeScript)      [Vercel]                 │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ Public Pages │  │ Owner Dashboard  │  │  Staff Dashboard  │   │
│  │ (SSR)        │  │ (Client + Query) │  │  (Client + Query) │   │
│  └──────────────┘  └─────────────────┘  └──────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS + Sanctum Bearer Token
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                              │
│                                                                 │
│  Laravel 13 (PHP 8.3+)         [Forge + DigitalOcean]           │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  Public    │  │  Owner   │  │  Staff   │  │   Admin     │  │
│  │  /v1/pub   │  │  /v1/own │  │  /v1/stf │  │   /v1/adm   │  │
│  └────────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Internal Routes (/v1/internal/*)              │  │
│  │           [shared secret, not user auth]                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────┬──────────────────┬─────────────────────┘
                         │                  │
           ┌─────────────┘                  └──────────────────┐
           ▼                                                    ▼
┌──────────────────────┐                       ┌───────────────────────┐
│     DATABASE LAYER   │                       │   AUTOMATION LAYER    │
│                      │                       │                       │
│  PostgreSQL          │                       │  n8n Cloud            │
│  [Managed, Neon or   │   Laravel fires       │  ┌─────────────────┐  │
│   DigitalOcean DB]   │   webhook jobs →      │  │ WA Confirmation │  │
│                      │                       │  │ WA Reminder     │  │
│  Single shared DB    │   ← n8n POSTs back    │  │ WA Delivery     │  │
│  Tenant-scoped by    │     to /internal/*    │  └────────┬────────┘  │
│  business_id         │                       │           │           │
│                      │                       │           ▼           │
└──────────────────────┘                       │  WhatsApp Business    │
                                               │  Cloud API (Meta)     │
                                               └───────────────────────┘
```

---

## Frontend Architecture

### Route Group Structure

```
app/[locale]/
├── (public)/          No auth. SSR. Customer booking flow + landing/pricing.
│                      Server Components for speed on mobile data.
│
├── (auth)/            No auth. Login, Register, Forgot password.
│
├── (customer)/        OTP-authenticated. Customer manages own bookings.
│
├── (dashboard)/       Sanctum-authenticated. Owner + Staff. Role-gated via middleware.
│                      Client Components. TanStack Query for data.
│
└── (admin)/           Sanctum-authenticated. Platform admin only. Role=admin.
```

### Data Fetching Rules

| Context | Method | Reason |
|---|---|---|
| Public booking pages | `fetch()` in Server Components | Fast initial load, no auth needed |
| Dashboard calendar | TanStack Query (`useQuery`) | Real-time, refetch on focus |
| Form mutations | TanStack Mutation + optimistic update | Responsive UX |
| Static-ish data (services, staff lists) | TanStack Query with 5min `staleTime` | Reduce API calls |
| Availability slots | TanStack Query with 30s `staleTime` | Slots change frequently |

### API Client
Single Axios instance in `services/api-client.ts`:
- Base URL from `NEXT_PUBLIC_API_URL` env var.
- Request interceptor: attaches Sanctum Bearer token from cookie.
- Response interceptor: normalizes errors into `AppError` shape.
- Locale header: sends `Accept-Language: ar` on all requests.

### State Management
```
Server state (bookings, staff, services data) → TanStack Query ONLY
UI state (open modals, active tab)             → React useState / useReducer
Cross-component UI state (active branch)       → Zustand (ui-store.ts)
Form state                                     → React Hook Form
Auth state (current user, token)               → Zustand (auth-store.ts)
```

Never use TanStack Query for UI state.
Never use Zustand for server state.

### Middleware (middleware.ts)
1. Detect locale from URL → `[locale]` segment.
2. If route is in `(dashboard)` or `(admin)` group:
   - Check for auth token → redirect to `/login` if missing.
   - Check role from token payload → redirect if insufficient.
3. If route is in `(public)` group: pass through, no auth check.
4. If route is in `(customer)` group: check OTP session token.

### i18n / RTL
- `next-intl` with `[locale]` dynamic segment.
- Default locale: `ar` (Arabic, RTL).
- Future locale: `en` (no structural changes needed — just add `en.json`).
- `dir` attribute set on `<html>` in root `layout.tsx` based on locale.
- All Arabic strings live in `i18n/messages/ar.json` — never hardcoded in JSX.

---

## Backend Architecture

### Layer Responsibilities

```
HTTP Request
    ↓
Middleware (auth, role, subscription check)
    ↓
Form Request (validation)
    ↓
Controller (thin: calls one Action, returns one Resource)
    ↓
Action (single business operation: validate business rules, call service, fire event)
    ↓
Service (complex cross-entity logic, e.g. AvailabilityService)
    ↓
Repository (complex queries only — simple queries stay in models/actions)
    ↓
Model (Eloquent, with relationships and global scope)
    ↓
PostgreSQL
```

### Key Services

**`AvailabilityService`** — the most critical class in the codebase.

Responsibilities:
- Generate available time slots for a branch/staff/service/date combination.
- Check if a specific slot (starts_at → ends_at) is free for a staff member.
- Called by: `CreateBookingAction`, `AvailabilityController`.

Conflict query (inside a DB transaction):
```sql
SELECT id FROM bookings
WHERE staff_id = :staffId
  AND status = 'confirmed'
  AND starts_at < :endsAt
  AND ends_at > :startsAt
LIMIT 1
```
Uses the composite index: `(staff_id, starts_at, ends_at)`.

**`OtpService`** — customer OTP lifecycle.

Responsibilities:
- Generate 6-digit OTP, store hashed in `otp_codes`.
- Trigger OTP delivery (via n8n webhook or direct SMS).
- Verify OTP (check hash, check expiry, mark consumed).
- Rate-limit: max 3 OTP sends per phone per 10 minutes.

**`N8nWebhookService`** — builds and fires webhook payloads to n8n.

Responsibilities:
- Format booking data into n8n-expected payload shape.
- POST to n8n webhook URLs (from `config/services.php`).
- Handles network failures gracefully (logs, does not throw to user).

### Multi-Tenancy Implementation

Every tenant-scoped model includes `BusinessScope`:

```php
// Applied automatically via boot() method in each model
protected static function boot(): void
{
    parent::boot();
    static::addGlobalScope(new BusinessScope());
}
```

`BusinessScope` resolves the current `business_id` from:
1. Authenticated user's `business_id` field (owner/staff).
2. Skips scope for: platform admin routes, public routes (booking flow resolves
   business_id from slug, not from auth).

**Tenant-scoped models:** `Branch`, `Staff`, `Service`, `Customer`, `Booking`.
**NOT scoped:** `User`, `OtpCode`, `Business` (these are meta/auth level).

### Queue Architecture

- **Driver:** database queue (sufficient for MVP volume — no Redis needed yet).
- **Queues:**
  - `default` — general jobs.
  - `notifications` — WhatsApp/reminder webhook jobs (routed via `Queue::route()` in AppServiceProvider).
- **Jobs:**
  - `SendBookingConfirmationWebhook` — fired on `BookingCreated`.
  - `SendReminderWebhook` — fired by n8n's cron pulling due-reminders.
  - `ExpireSubscriptionsJob` — daily scheduled job, checks `subscription_expires_at`.
- **Worker command (production):** `php artisan queue:work --queue=notifications,default`

### Event/Listener Map

| Event | Listeners |
|---|---|
| `BookingCreated` | `DispatchBookingConfirmationJob` |
| `BookingCompleted` | `UpdateCustomerVisitStats` |
| `BookingCancelled` | (fire cancellation notification in Phase 2) |
| `BookingMarkedNoShow` | (fire follow-up notification in Phase 2) |

### Middleware Stack (per route group)

| Route Group | Middleware Chain |
|---|---|
| `/public/*` | `throttle:60,1` |
| `/auth/*` | `throttle:10,1` |
| `/owner/*` | `auth:sanctum`, `role:owner`, `subscription.active` |
| `/staff/*` | `auth:sanctum`, `role:staff`, `subscription.active` |
| `/customer/*` | `auth:sanctum` (OTP session token) |
| `/admin/*` | `auth:sanctum`, `role:admin` |
| `/internal/*` | `internal.webhook.secret`, `throttle:100,1` |

---

## Database Architecture

### Multi-tenancy Schema

Every tenant table has `business_id` as a non-nullable foreign key.
The `GlobalScope` ensures queries are always scoped correctly.

### Critical Index: Booking Conflict Prevention

```sql
CREATE INDEX bookings_staff_time_idx
ON bookings (staff_id, starts_at, ends_at)
WHERE status = 'confirmed';
```

This partial index (WHERE status = 'confirmed') makes conflict queries
extremely fast while ignoring cancelled/no-show records.

### UUID Strategy
All primary keys are UUIDs (v4). Reasons:
- Prevents tenant ID enumeration (security).
- Safe to generate on the client before inserting (useful for optimistic UI updates).
- No integer overflow concerns at scale.

### Timestamps / Timezones
- All `TIMESTAMP` columns stored in **UTC**.
- Laravel models configured with `$dateFormat = 'Y-m-d H:i:s'`.
- Frontend receives ISO 8601 strings, converts to `Africa/Cairo` (UTC+3) for display.
- `date_default_timezone_set('UTC')` in Laravel's `config/app.php`.

### Soft Deletes
Applied to: `bookings`, `staff`, `services`, `branches`.
Reason: Owners need to see historical booking data even after deleting a
staff member or deactivating a service.

---

## n8n Automation Architecture

### Communication Pattern

```
Laravel (Event fires)
  → Laravel Job pushed to 'notifications' queue
    → Job runs: N8nWebhookService::send(webhookUrl, payload)
      → n8n webhook triggered
        → n8n workflow executes
          → WhatsApp Cloud API call
            → n8n POSTs result to /api/v1/internal/notifications/{id}/callback
              → Laravel updates notifications_log.status
```

### n8n Workflow Inventory

| Workflow | Trigger | MVP? |
|---|---|---|
| Booking Confirmation | Laravel webhook (POST) | ✅ Yes |
| Appointment Reminder | Cron (every 15 min, polls Laravel) | ✅ Yes |
| WhatsApp Delivery (sub-workflow) | Called by above | ✅ Yes |
| SMS Fallback | WhatsApp failure → fallback | 🔲 Phase 2 |
| Missed Appointment Follow-up | Cron on no_show status | 🔲 Phase 2 |
| Customer Review Request | Cron on completed status | 🔲 Phase 2 |
| Rebooking Campaign | Manual trigger or cron | 🔲 Phase 3 |

### Internal Endpoint Security
n8n calls Laravel's `/internal/*` endpoints with:
```
X-Internal-Secret: {INTERNAL_WEBHOOK_SECRET from .env}
```
`VerifyInternalWebhookSecret` middleware rejects any request without this header.
Never expose these endpoints to the public internet without this check.

---

## Authentication Architecture

### Auth Flow Map

```
CUSTOMER (public booking):
  Enter phone → OTP sent (WhatsApp/SMS) → Enter OTP → Sanctum token returned
  Token stored in httpOnly cookie → Used for /customer/* routes

OWNER (dashboard):
  Enter email/username + password → Sanctum token returned
  Token stored in httpOnly cookie → Used for /owner/* routes

STAFF (dashboard):
  Enter username + password (set by owner) → Sanctum token returned
  Token stored in httpOnly cookie → Used for /staff/* routes

ADMIN (admin panel):
  Enter email + password → Sanctum token returned
  Token stored in httpOnly cookie → Used for /admin/* routes
```

### OTP Rules
- 6-digit numeric code.
- Stored as **hashed** value in `otp_codes` table (hash the OTP before storing).
- Expires after **5 minutes**.
- Single-use: marked as `consumed_at` on successful verification.
- Rate limited: max 3 OTP requests per phone per 10 minutes (Laravel rate limiter).

### Token Strategy
- Sanctum API tokens (not SPA cookies) — enables future mobile app use.
- Tokens stored in frontend as httpOnly cookies (not localStorage — XSS protection).
- Token name includes role: `owner-token`, `staff-token`, `customer-token`.
- Token expiry: 30 days for owner/staff, 24 hours for customer.

---

## Authorization Architecture

### Policy Classes

| Policy | Governs |
|---|---|
| `BranchPolicy` | CRUD access to branches (owner: own branches only) |
| `StaffPolicy` | CRUD access to staff (owner: own staff only) |
| `ServicePolicy` | CRUD access to services (owner: own services only) |
| `BookingPolicy` | View (owner: all in business; staff: own only), update status |
| `BusinessPolicy` | Profile updates (owner: own business only; admin: all) |

### Role Gate Examples
```php
// Owner can update any booking in their business
public function update(User $user, Booking $booking): bool
{
    return $user->role === UserRole::Owner
        && $user->business_id === $booking->business_id;
}

// Staff can only update their own bookings
public function updateStatus(User $user, Booking $booking): bool
{
    if ($user->role === UserRole::Staff) {
        return $user->staffProfile->id === $booking->staff_id;
    }
    return $user->role === UserRole::Owner
        && $user->business_id === $booking->business_id;
}
```

---

## Deployment Architecture

### Infrastructure Map

| Service | Provider | Notes |
|---|---|---|
| Next.js Frontend | Vercel | Zero-ops, free tier covers MVP traffic, auto-deploys from main |
| Laravel API | DigitalOcean + Forge | Forge manages Nginx, PHP-FPM, SSL, queue workers |
| PostgreSQL | Neon or DigitalOcean Managed DB | Automated backups, connection pooling |
| n8n | n8n Cloud | Simplest option for solo founder — no self-hosted ops |
| File Storage (logos) | Cloudflare R2 or S3 | MVP: use local storage with a CDN URL if R2 feels complex |
| WhatsApp API | Meta Cloud API directly or via 360dialog BSP | BSP is faster to onboard |

### Environment Variables

**Next.js (.env.local)**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Laravel (.env)**
```
APP_URL=https://api.yourdomain.com
DB_CONNECTION=pgsql
DB_HOST=your-managed-db-host
DB_DATABASE=booking_saas
DB_USERNAME=...
DB_PASSWORD=...

QUEUE_CONNECTION=database

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com

N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.com
INTERNAL_WEBHOOK_SECRET=your-long-random-secret

WHATSAPP_API_TOKEN=your-meta-token
WHATSAPP_PHONE_NUMBER_ID=your-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-account-id
```

### Production Checklist
- [ ] `APP_ENV=production`, `APP_DEBUG=false` in Laravel
- [ ] `LOG_CHANNEL=stack` with daily rotation
- [ ] SSL on all domains (Forge handles this via Let's Encrypt)
- [ ] Queue worker running as a daemon (Forge Daemon or Supervisor)
- [ ] `ExpireSubscriptionsJob` scheduled in `routes/console.php`
- [ ] DB backups enabled on managed DB (daily minimum)
- [ ] Rate limiting configured on sensitive routes (OTP, auth)

---

## Key Architecture Decisions & Rationale

| Decision | Why |
|---|---|
| Single shared DB (not DB-per-tenant) | Solo founder — zero extra ops overhead, easy migrations, cross-tenant admin reporting is simpler |
| Laravel over Node.js backend | Solo founder already knows PHP/Laravel; Eloquent ORM + Sanctum + Queue system = everything needed out of the box |
| n8n for notifications (not direct WhatsApp calls) | Iterate on message templates/timing without backend deploys; visual debugging; easy to add SMS/email fallback later |
| Next.js App Router | SSR for public booking pages (mobile speed critical); easy RSC/Client split; `next-intl` RTL support |
| TanStack Query (not Redux/SWR) | Perfect fit for server state (bookings, calendar); built-in cache invalidation; optimistic updates for booking status changes |
| Sanctum (not Passport/Auth0/Clerk) | Three custom auth flows (OTP customer, password owner/staff, role scoping) are simpler to own directly than fight a library's abstractions; free; no external vendor dependency |
| Vercel for frontend | Zero-ops, instant deploys, edge network = fast globally; free tier more than enough for MVP |
| Manual subscription billing | Removes entire payment gateway complexity from MVP; solo founder can handle Instapay manually for first 15 shops |
