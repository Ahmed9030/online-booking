# Booking SaaS — Product & Technical Specification

**Product:** Subscription SaaS booking & appointment management tool for barbershops/men's salons
**Market:** Egypt first, GCC (Saudi/UAE) expansion later
**Stack:** Next.js (App Router, TS) · Laravel 13 API · PostgreSQL · n8n · Arabic-first RTL
**Builder:** Solo founder, 1–2 month MVP timeline
**Last updated:** June 2026

---

## 1. MVP Definition

| Dimension | Decision |
|---|---|
| Market | Egypt first (GCC expansion later) |
| Niche | Barbershops / men's salons |
| Business model | SaaS tool (not marketplace) — business gets own branded booking page |
| Buyer | Business owner — flat monthly subscription |
| Core pain killed | WhatsApp booking chaos + no-shows |
| Multi-branch | Yes — owner can manage multiple locations |
| Payments (customer) | None in MVP — in-person payment only |
| Subscription billing (you) | Manual — Instapay/bank transfer, admin flips status |
| Notifications | WhatsApp primary channel (via n8n) |
| Customer accounts | Required — phone + OTP (no password) |
| Staff accounts | Required — own login (username/password), view own schedule only |
| Staff booking | Customer picks specific barber OR "any available" |
| Pricing | Single flat tier, monthly, free trial period |
| Team | Solo founder/developer |

---

## 2. Problem Analysis

- Bookings happen via WhatsApp/phone calls — no central calendar, easy to double-book or forget appointments.
- No-shows are common with zero consequence or reminder system.
- No visibility into which barber is busy/free at a glance.
- No customer history — can't see who's a regular, who hasn't returned in months.
- Multi-branch owners have no unified view across locations — each branch runs on its own WhatsApp number.
- No-shows are a direct revenue leak on a perishable resource (an empty chair-hour can never be resold).

## 3. Competitor Analysis

| Competitor | Strength | Weakness (your opening) |
|---|---|---|
| Fresha | Free, polished, global, marketplace+SaaS hybrid | Not Arabic-first/RTL-native, support not localized to Egypt |
| Vagaro / Booksy | Mature feature set | Built for US/EU, USD pricing, no WhatsApp-native reminders |
| WhatsApp Business (status quo) | Free, zero learning curve, already trusted | No calendar logic, no automation, no reporting |
| Local Egyptian players | — | Fragmented, early-stage — re-verify current landscape before launch |

**Your wedge:** Arabic-first UI, WhatsApp-native reminders, EGP pricing, built around how Egyptian barbershops actually operate (cash-only, walk-ins + bookings mixed, multi-branch family businesses).

## 4. Market Opportunity

- Egypt's barbershop/salon sector is large, fragmented, and mostly informal — most shops still run entirely on WhatsApp/phone.
- High mobile + WhatsApp penetration makes WhatsApp reminders a near-universal reach channel with no app install required.
- No dominant local, Arabic-native booking SaaS has full market mindshare yet.
- GCC expansion path later — similar barbershop culture, higher willingness-to-pay, same Arabic-first product fits with currency/localization tweaks.

## 5. MVP Scope

- Business owner signup → business profile (name, logo, branches)
- Branch management (multiple locations per business)
- Staff management (add barbers, assign to branch, working hours/days off)
- Services per branch/staff (name, duration, price)
- Public booking page per branch (Arabic RTL, shareable link)
- Customer account via phone + OTP (auto-created on first booking)
- Owner/staff dashboard: calendar view, manual booking entry
- WhatsApp automated reminders (confirmation + reminder before appointment)
- Basic customer list per business (name, phone, visit history/count)
- Flat monthly subscription, manual payment collection (Instapay/bank transfer)

## 6. Features Postponed (Phase 2/3)

- Online payments/deposits for customers
- Marketplace/public discovery & search
- Reviews & ratings
- SMS/email channels (WhatsApp only for v1)
- Loyalty programs, packages, gift cards
- Advanced analytics/reports
- Native mobile apps
- Multi-language beyond Arabic
- Automated marketing campaigns / rebooking nudges
- Tiered pricing plans
- Reschedule flow (cancel + rebook is the MVP shortcut)

## 7. Monetization & Pricing

- Flat monthly subscription, paid by business owner.
- Generous free trial (14–30 days) — month 1–2 goal is proving retention/habit formation, not maximizing revenue.
- Single flat tier (no branch/staff limits initially) — revisit tiered pricing once you have 10–20 paying shops and real usage data.
- Validate price point against local willingness-to-pay (e.g., what shops currently pay for POS software/Instagram ads), not international SaaS benchmarks.

## 8. Go-To-Market Plan

- **Beachhead:** one Cairo neighborhood/district, personally onboard 10–15 barbershops by hand.
- **Pitch:** "Stop losing bookings in WhatsApp chats — get a real calendar + automatic reminders that cut no-shows."
- **Onboarding:** founder sets up first branch/staff/services during onboarding call.
- **Retention proof point:** track no-show rate before/after — becomes case study for next 50 shops.
- **Expansion trigger:** prove retention/word-of-mouth in one city before expanding geography or niche.

---

## 9. Personas

**Owner Omar** — owns 2 branches, 6 barbers, runs everything via WhatsApp/Excel. Wants one place to see all bookings, reduce no-shows, look professional.

**Barber Bilal** — works at one branch, has regulars. Wants to see his own day clearly via simple mobile-first UI.

**Customer Karim** — books via link shared on Instagram/WhatsApp status. Wants fast booking, no app download, no password, WhatsApp reminder.

**Admin (You)** — manages business accounts, activates/deactivates subscriptions manually, monitors platform health.

## 10. Customer Flow

```
Booking Link → Select Branch (if multi-branch) → Select Service
→ Select Barber ["Any Available" | Specific] → Select Date & Time
→ Enter Name + Phone → OTP Verification → Booking Confirmed
(screen + WhatsApp) → [later] View/Cancel via "My Bookings" (phone+OTP)
```

## 11. Business Owner Flow

```
Sign Up → Create Business Profile → Add Branch(es) → Add Staff per branch
→ Add Services per branch/staff → Get shareable booking link per branch
→ Dashboard: Calendar (day/week, filter branch/staff) → Manual booking entry
→ Customer list → Settings (subscription status, business info)
```

## 12. Staff Flow

```
Staff Login (owner-provided credentials) → View own day/week schedule only
→ Mark appointment completed / no-show → No access to other staff or settings
```

## 13. Admin Flow

```
Admin Login → View all registered businesses → View subscription status
→ Manually activate/deactivate subscription (after confirming payment)
→ View basic platform stats
```

---

## 14. System Architecture

### Principles
- Favor managed/boring infrastructure over self-hosted complexity (solo founder time = scarcest resource).
- Multi-tenant from day one: single Postgres DB, shared schema, tenant-scoped by `business_id`.
- Simple but role-aware auth: Owner, Staff, Admin roles.

### Frontend (Next.js App Router + TypeScript)
- Route groups: `(public)` booking pages, `(auth)`, `(customer)`, `(dashboard)`, `(admin)`.
- `next-intl` — Arabic default locale, RTL via `dir="rtl"`, English addable later without refactor.
- Server Components for public booking pages (SSR speed, mobile data); Client Components for dashboard.

### Backend (Laravel 13 API)
- PHP 8.3+ required. Pure API (no Blade), consumed by Next.js.
- Layered: Controllers (thin) → Actions/Services → Repositories → Models.
- Laravel Sanctum for auth. Database-driven queues sufficient for MVP volume (no Redis needed yet).
- `Queue::route()` (Laravel 13) to route WhatsApp-webhook jobs to a dedicated queue.

### API Architecture
- RESTful JSON, versioned from day one (`/api/v1/...`).
- Route groups per role: `/owner/*`, `/staff/*`, `/admin/*`, `/public/*` (unauthenticated booking flow), `/internal/*` (n8n callbacks).

### Authentication
- Laravel Sanctum issuing API tokens.
- Customers: phone + OTP only (via WhatsApp/SMS OTP provider — evaluate Twilio Verify or local Egyptian gateway).
- Owner/Staff: username-or-email + password.
- Admin: same Sanctum auth, `admin` role flag.
- Why not NextAuth/Clerk/Auth0: three distinct auth flows (OTP customers, password staff/owners, role scoping per business/branch) are simpler to control directly with Sanctum than to fight a third-party abstraction — and it's free.

### Authorization
- Role-based: `owner`, `staff`, `admin`.
- Laravel Policy classes (`BookingPolicy`, `BranchPolicy`, etc.) — owners manage all their branches/staff; staff see/update only their own schedule; admin has platform-wide read + activation rights.
- Every dashboard request scoped by `business_id` (and `branch_id` for staff) at the policy/query level.

### Multi-Tenancy
- Single DB, shared schema, every tenant-owned table carries `business_id`.
- Global Eloquent scope (`BusinessScope`) auto-filters queries by the authenticated user's `business_id` — primary defense against cross-tenant data leaks.

### Notifications
- WhatsApp Business Cloud API as primary channel, triggered through n8n (not directly from Laravel).
- Flow: Laravel event (`BookingCreated`, `ReminderDue`) → Laravel Job → webhook to n8n → n8n sends WhatsApp template + handles retry/failure.
- Routing through n8n allows iterating on message templates/timing without backend redeploys.

### Payments
- MVP: none for customer payments. Your own subscription collection is manual (`subscription_status` + `subscription_expires_at` fields, flipped by admin).
- Future: Paymob or Fawry for Egypt-specific online payments; Stripe for global/GCC if entity allows. Design a `Payment` domain abstraction now so swapping providers later doesn't touch booking logic.

### n8n Automation
- Sits outside Laravel, triggered via webhooks from Laravel events.
- Handles WhatsApp templating/sending, retry-on-failure, scheduled reminder dispatch.
- Keeps Laravel focused on core business logic while n8n owns "what happens when X occurs."

### Production Deployment
- **Frontend:** Vercel (zero-ops, free tier covers MVP traffic).
- **Backend:** Laravel Forge + DigitalOcean/Hetzner droplet, or Railway/Render for simplest ops.
- **Database:** Managed Postgres (DigitalOcean Managed DB, Supabase, or Neon) — don't self-host.
- **n8n:** n8n Cloud (pragmatic for solo founder) or self-hosted small VPS.
- **WhatsApp:** Meta Business Cloud API directly, or a BSP (Twilio, 360dialog) for faster onboarding/approval.

---

## 15. Database Schema (PostgreSQL)

### ERD (text)
```
businesses ──< branches ──< staff
    │                │         │
    │                │         ├──< staff_services >── services
    │                │         └──< staff_working_hours
    │                │
    │                ├──< branch_working_hours
    │                ├──< services
    │                └──< bookings
    │
    ├──< customers (scoped per business)
    └──< subscriptions (fields on businesses table for MVP)

bookings ──> customers
bookings ──> staff (nullable until assigned)
bookings ──> services
bookings ──> branches

users (owner/staff/admin) ──> businesses (owner_id)
staff ──> users (1:1, staff login)
```

### Tables

#### `users`
Auth table for Owners, Staff, Admins (customers are separate).
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses, nullable | null for platform admins |
| role | enum('owner','staff','admin') | |
| name | varchar | |
| email | varchar, nullable, unique | |
| username | varchar, unique, nullable | for staff login |
| password | varchar (hashed) | |
| phone | varchar, nullable | |
| is_active | boolean default true | |
| last_login_at | timestamp, nullable | |
| created_at, updated_at | timestamp | |

Indexes: `business_id`, `role`, unique(`email`), unique(`username`)

#### `businesses`
Top-level tenant.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_user_id | uuid FK → users | |
| name | varchar | |
| logo_url | varchar, nullable | |
| description | text, nullable | |
| slug | varchar, unique | used in public booking URLs |
| subscription_status | enum('trial','active','expired','suspended') | |
| subscription_expires_at | timestamp, nullable | |
| created_at, updated_at | timestamp | |

Indexes: unique(`slug`), `subscription_status`

#### `branches`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| name | varchar | |
| address | text | |
| city | varchar | |
| whatsapp_number | varchar | branch-level number |
| slug | varchar | unique per business |
| is_active | boolean default true | |
| created_at, updated_at | timestamp | |

Indexes: `business_id`, unique(`business_id`,`slug`)

#### `branch_working_hours`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| branch_id | uuid FK → branches | |
| weekday | smallint (0–6) | |
| open_time | time, nullable | null = closed |
| close_time | time, nullable | |

Indexes: `branch_id`, unique(`branch_id`,`weekday`)

#### `staff`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| branch_id | uuid FK → branches | primary branch |
| user_id | uuid FK → users, nullable | login account |
| name | varchar | |
| photo_url | varchar, nullable | |
| is_active | boolean default true | |
| created_at, updated_at | timestamp | |

Indexes: `business_id`, `branch_id`, `user_id`

#### `staff_working_hours`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| staff_id | uuid FK → staff | |
| weekday | smallint (0–6) | |
| start_time | time, nullable | null = off |
| end_time | time, nullable | |

Indexes: `staff_id`, unique(`staff_id`,`weekday`)

#### `services`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| branch_id | uuid FK → branches | |
| name | varchar | |
| duration_minutes | integer | core for slot calculation |
| price | decimal(10,2) | reference only |
| is_active | boolean default true | |
| created_at, updated_at | timestamp | |

Indexes: `business_id`, `branch_id`

#### `staff_services` (M2M)
| Column | Type |
|---|---|
| staff_id | uuid FK → staff |
| service_id | uuid FK → services |

Composite PK(`staff_id`,`service_id`)

#### `customers`
Scoped per business — same person at two businesses = two rows.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| phone | varchar | OTP-verified identity |
| name | varchar | |
| otp_verified_at | timestamp, nullable | |
| visit_count | integer default 0 | denormalized counter |
| last_visit_at | timestamp, nullable | |
| created_at, updated_at | timestamp | |

Indexes: `business_id`, unique(`business_id`,`phone`)

#### `otp_codes`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| phone | varchar | |
| code | varchar(6) | |
| expires_at | timestamp | |
| consumed_at | timestamp, nullable | |
| created_at | timestamp | |

Indexes: `phone`, `expires_at`

#### `bookings`
Core entity.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK → businesses | |
| branch_id | uuid FK → branches | |
| customer_id | uuid FK → customers | |
| service_id | uuid FK → services | |
| staff_id | uuid FK → staff, nullable | assigned immediately even for "any available" |
| starts_at | timestamp | |
| ends_at | timestamp | derived from service duration |
| status | enum('confirmed','completed','no_show','cancelled') | |
| source | enum('online','manual') | manual = staff/owner entered |
| created_by_user_id | uuid FK → users, nullable | |
| notes | text, nullable | |
| created_at, updated_at | timestamp | |

Indexes: `business_id`, `branch_id`, `staff_id`, composite(`staff_id`,`starts_at`,`ends_at`) **(critical for conflict checks)**, `customer_id`, `status`

#### `notifications_log`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| booking_id | uuid FK → bookings | |
| type | enum('confirmation','reminder','cancellation') | |
| channel | enum('whatsapp','sms','email') | |
| status | enum('queued','sent','failed') | |
| sent_at | timestamp, nullable | |
| error_message | text, nullable | |
| created_at | timestamp | |

Indexes: `booking_id`, `status`

### Key Design Notes
- UUIDs over auto-increment ints — prevents tenant ID enumeration across businesses.
- **Conflict prevention:** before inserting a booking, query `bookings` where `staff_id = X AND starts_at < new_end AND ends_at > new_start AND status = 'confirmed'`, wrapped in a transaction with row lock to prevent race conditions on simultaneous bookings.
- **"Any available" logic:** server checks all staff qualified for the service (`staff_services`) against `staff_working_hours` and existing `bookings`, assigns the first free staff member immediately at booking time.
- **Global tenant scope** on every `business_id`-bearing table — main defense against cross-tenant leaks.
- Recommend soft deletes (`deleted_at`) on `bookings`, `staff`, `services`, `branches` — booking history should never hard-delete.

---

## 16. n8n Automation Design

**Pattern:** Laravel Event → Laravel Job → webhook POST to n8n → n8n templates/sends/retries → callback to Laravel.

### MVP Workflows

**1. Booking Confirmation**
- Trigger: `BookingCreated` event (online + manual bookings)
- Workflow: Webhook → format Arabic message → WhatsApp Cloud API send → callback `POST /internal/notifications/{id}/sent` → on failure, retry 3x exponential backoff → mark `failed`
- Inputs: `booking_id`, `customer_phone/name`, `service_name`, `staff_name`, `branch_name`, `starts_at`
- Outputs: WhatsApp message sent; `notifications_log` updated

**2. Appointment Reminder**
- Trigger: Cron (every 15 min) polls `GET /internal/bookings/due-reminders` (bookings starting ~3h, no reminder sent yet) — Laravel remains source of truth, n8n stays stateless
- Workflow: Fetch due bookings → loop → format → WhatsApp send → callback per booking
- Failure handling: per-item failure doesn't block loop; retried on next cron pass if still in window

**3. WhatsApp Delivery (shared sub-workflow)**
- Called by #1 and #2 to avoid duplicating send logic
- Inputs: `phone`, `template_name`, `variables` → Outputs: delivery status
- Centralizes WhatsApp API error handling (rate limits, invalid numbers, unapproved templates)

### Phase 2 Workflows (scaffolded, not built for MVP)
- **SMS fallback** — same payload shape as WhatsApp sub-workflow, triggered on WhatsApp failure
- **Email** — for GCC/international expansion later
- **Missed appointment follow-up** — cron on `status='no_show'`, soft "we missed you" message
- **Customer review request** — cron on `status='completed'` + X hours elapsed
- **Marketing/rebooking campaigns** — segment query (e.g., no visit in 45+ days) → loop → WhatsApp re-engagement, rate-limit aware

### Practical Notes
- MVP only needs workflows #1–#3.
- **Submit WhatsApp message templates for Meta approval early (Week 2–3)** — approval can take days and is a common hidden bottleneck.
- Protect `/internal/*` routes with a shared-secret header (n8n → Laravel), not full user auth.

---

## 17. Frontend Structure (Next.js)

### UI/State Decisions
- **UI library:** shadcn/ui + Tailwind CSS (RTL via Tailwind `rtl:` variants).
- **Calendar:** FullCalendar (React), RTL-supported, handles day/week + resource (staff column) views.
- **Server state:** TanStack Query (caching, refetch, optimistic updates).
- **Client/UI state:** local state + Zustand only where truly cross-component (e.g., active branch selector).
- **Forms:** React Hook Form + Zod.
- **i18n:** next-intl, Arabic default, English addable later without rewrite.

### Project Tree
```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── (public)/            # landing, pricing, /book/[businessSlug]/[branchSlug]/*
│   │   ├── (auth)/              # login, register, forgot-password
│   │   ├── (customer)/          # my-bookings (OTP-authenticated)
│   │   ├── (dashboard)/         # owner + staff: dashboard, calendar, bookings,
│   │   │                        # customers, services, staff, branches, settings
│   │   └── (admin)/             # businesses, overview
│   └── api/                     # only if Next.js route handlers needed (e.g. OG images)
│
├── components/
│   ├── ui/                      # shadcn primitives
│   ├── booking/                 # service-selector, staff-selector, time-slot-picker, otp-input
│   ├── calendar/                # booking-calendar, manual-booking-modal
│   ├── dashboard/                # sidebar-nav, branch-switcher, stats-cards
│   ├── forms/                   # service-form, staff-form, branch-form
│   └── layout/                  # header, footer, locale-switcher
│
├── features/                    # domain-sliced: auth, bookings, staff, services, branches, customers
│   └── [domain]/{hooks, api, types}
│
├── hooks/                       # use-debounce, use-media-query, use-toast
├── services/                    # api-client.ts, query-client.ts
├── store/                       # ui-store.ts (Zustand, minimal use)
├── lib/
│   ├── utils.ts
│   ├── validations/             # Zod schemas
│   └── constants.ts
├── i18n/                        # routing.ts, messages/ar.json, messages/en.json, request.ts
├── types/                       # api.types.ts, models.types.ts
└── middleware.ts                # role-based route protection, locale detection
```

### Key Decisions
- Route groups by access level keep middleware simple (check group → check role).
- `features/` keeps each domain self-contained — easy to find/modify without hunting across codebase.
- Feature `api/` files call Laravel directly (no Next.js proxy layer).

---

## 18. Backend Structure (Laravel 13)

PHP 8.3+ required. Zero breaking changes from Laravel 12 — attribute-based config (`#[Fillable]`, `#[Authorize]`) is optional; structure below uses traditional property syntax.

### Project Tree
```
app/
├── Actions/
│   ├── Bookings/        # CreateBookingAction, AssignAvailableStaffAction, CancelBookingAction,
│   │                     # MarkBookingCompletedAction, MarkBookingNoShowAction
│   ├── Auth/             # SendOtpAction, VerifyOtpAction, RegisterBusinessOwnerAction
│   ├── Staff/             # CreateStaffAction, SetStaffWorkingHoursAction
│   ├── Branches/          # CreateBranchAction
│   └── Subscriptions/     # ActivateSubscriptionAction, ExpireSubscriptionAction
│
├── Http/
│   ├── Controllers/Api/V1/
│   │   ├── Public/        # BusinessBookingController, AvailabilityController, BookingController
│   │   ├── Auth/          # OtpController, LoginController, RegisterController
│   │   ├── Owner/         # Branch/Staff/Service/Booking/Customer/SettingsController
│   │   ├── Staff/         # ScheduleController
│   │   ├── Customer/      # MyBookingsController
│   │   ├── Admin/         # BusinessController, SubscriptionController
│   │   └── Internal/      # DueRemindersController, NotificationCallbackController (n8n)
│   ├── Middleware/        # EnsureUserHasRole, EnsureSubscriptionActive,
│   │                       # VerifyInternalWebhookSecret, SetLocaleFromRequest
│   ├── Requests/          # per-domain Form Requests
│   └── Resources/         # Booking/Branch/Staff/Service/Customer/BusinessResource
│
├── Models/                # User, Business, Branch, BranchWorkingHour, Staff, StaffWorkingHour,
│                           # Service, Customer, OtpCode, Booking, NotificationLog
├── Policies/               # Branch, Staff, Service, Booking, BusinessPolicy
├── Events/                 # BookingCreated, BookingCancelled, BookingMarkedNoShow, ReminderDue
├── Listeners/               # DispatchBookingConfirmationJob, UpdateCustomerVisitStats
├── Jobs/                    # SendBookingConfirmationWebhook, SendReminderWebhook, ExpireSubscriptionsJob
├── Notifications/           # reserved for Phase 2 channels
├── Scopes/                  # BusinessScope (global tenant filter)
├── Services/                 # AvailabilityService, OtpService, N8nWebhookService
├── Repositories/             # BookingRepository, AvailabilityRepository
└── Providers/                 # AppServiceProvider, AuthServiceProvider, EventServiceProvider

routes/api/v1/{public,auth,owner,staff,customer,admin,internal}.php
database/{migrations,factories,seeders}/
tests/Feature/{Booking,Auth,Authorization}/, tests/Unit/AvailabilityServiceTest.php
```

### Key Decisions
- **Actions over fat Services** for single operations — testable, reusable across public/manual booking paths.
- **`AvailabilityService` is the most important class** — shared conflict-checking logic for both public booking and "any available" assignment. Get its query right (using the composite index) and most booking-integrity bugs disappear.
- **`BusinessScope` global scope** applied to all tenant models — primary multi-tenancy safety net.
- **`EnsureSubscriptionActive` middleware** applies only to Owner/Staff dashboard routes, not public booking routes (don't break existing customers over a billing delay).
- **`Queue::route()`** (Laravel 13) — route notification jobs to a dedicated queue/connection in `AppServiceProvider`.

---

## 19. UI/UX Screen Inventory

Marked **[MVP]** or **[Phase 2]**.

### Public/Marketing
- Landing Page [MVP, simplified] — hero on WhatsApp-chaos pain, 3-step how-it-works, CTA → register
- Pricing Page [MVP, simplified] — single pricing card, trial length, CTA

### Customer Booking Flow (public, RTL)
- Branch/Service Selection [MVP]
- Staff Selection [MVP] — "Any Available" highlighted + staff cards
- Time Slot Picker [MVP] — only valid slots shown, no greyed-out unavailable ones
- Confirm + OTP [MVP] — summary, name/phone, OTP input
- Success Screen [MVP]
- My Bookings (Customer) [MVP, minimal] — view/cancel; reschedule is Phase 2

### Owner/Staff Dashboard
- Login [MVP]
- Register (Owner) [MVP] — creates business + first branch in one flow
- Dashboard/Overview [MVP, simplified] — today's bookings, branch switcher, quick add
- Calendar [MVP, core] — FullCalendar day/week, staff columns (owner) or single column (staff), manual booking modal
- Manual Booking Modal [MVP]
- Bookings List [MVP, simple table/cards]
- Customers [MVP, simple] — search, visit count/last visit, detail history
- Services [MVP, owner-only] — CRUD
- Staff [MVP, owner-only] — CRUD, working hours, login creation
- Branches [MVP, owner-only] — CRUD, working hours, WhatsApp number
- Settings [MVP, minimal] — business profile, subscription status badge, password change
- Reports [Phase 2]
- Notifications settings [Phase 2] — MVP behavior is fixed/non-configurable

### Admin
- Businesses List [MVP, simple] — table with status, expiry, activate action
- Business Detail [MVP, simple] — manual subscription activation

### Explicitly cut from MVP
Reports, customer segmentation, notification settings, reschedule flow, English locale toggle, reviews, marketing campaign builder, payment gateway screens.

---

## 20. Development Roadmap

### MVP Roadmap (Weeks 1–8, solo founder)

| Week | Focus | Key Deliverables |
|---|---|---|
| 1 | Backend foundation | Laravel 13 setup, full schema migrations, models, `BusinessScope`, Sanctum scaffolding |
| 2 | Core booking logic | `AvailabilityService`, `CreateBookingAction`, conflict-checking, "any available" assignment + feature tests |
| 3 | Owner/Staff API | Branch/Staff/Service CRUD + Policies, customer OTP auth flow |
| 4 | Frontend foundation | Next.js setup, i18n/RTL, shadcn/ui, auth screens, public booking flow |
| 5 | Dashboard frontend | Calendar (FullCalendar), manual booking modal, bookings list, customers list |
| 6 | Owner management screens | Branches, Staff, Services CRUD, Settings |
| 7 | n8n integration | WhatsApp Cloud API + template approval, confirmation/reminder workflows, webhook wiring |
| 8 | Polish + first onboarding | Bug fixes, admin subscription activation, onboard 2–3 real shops, gather feedback |

**Critical path risk:** WhatsApp template approval — submit templates by Week 2–3, not Week 7, since Meta review time is outside your control.

### Phase 2 Roadmap (~Month 3–4)
1. Reports/analytics (no-show rate, revenue) — needs MVP data first
2. Missed appointment follow-up automation — depends on owners reliably marking no-shows
3. Customer review requests
4. Payment gateway integration (Paymob) for subscription billing automation
5. Reschedule flow
6. Tiered pricing (once enough paying shops exist to justify segmentation)

### Phase 3 Roadmap (~Month 5+)
1. Marketplace/discovery layer — only once you have density in one city
2. GCC expansion (Saudi/UAE) — currency, business registration, WhatsApp localization
3. Multi-language (English toggle) — architecture already supports this
4. Online customer payments/deposits
5. Marketing campaign automation
6. Native mobile apps — only if web usage data justifies it

---

## Open Items to Revisit
- Validate the EGP/month price point against real shop owner conversations before finalizing.
- Confirm OTP delivery provider (Twilio Verify vs. local Egyptian SMS/WhatsApp gateway) — cost and reliability vary.
- Re-check the current Egyptian local-competitor landscape before launch (was flagged as worth a fresh search at GTM time).
