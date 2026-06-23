# Progress Tracker
# Booking SaaS — Barbershop Appointment Platform

> **AI Instructions:**
> Update this file at the end of every coding session or whenever the
> current phase, active feature, or implementation state changes.
> Always update "Current Status", "Last Completed", and "Next Up" sections.
> Never delete history — append to the log at the bottom.

---

## Current Status

**Phase:** 1 — Backend Foundation
**Active Feature:** Middleware foundation for secured API access
**Last Session:** Implemented `02-Models + Relationships + Multi-Tenancy.md`
**Build Week:** 1 of 8

---

## Last Completed
- Created Eloquent models for `Business`, `Branch`, `Staff`, `Service`, `Booking`, `Customer`, `OtpCode`, working hours, and `NotificationLog`
- Added all specified relationships, UUID usage, fillable fields, casts, and soft deletes where required
- Added `BusinessScope` and applied it to `Branch`, `Staff`, `Service`, `Customer`, and `Booking`
- Added backed enums for `UserRole`, subscription status, booking status/source, and notification fields
- Updated `User` for Sanctum API tokens, UUIDs, role casting, and business/staff/owned-business relationships
- Verified Phase 1 setup basics are complete: Laravel 13 app, PHP 8.3 minimum, PostgreSQL/database queue env config, Sanctum dependency, versioned API route includes, and route files

---

## Next Up
1. Add `EnsureUserHasRole` middleware
2. Add `EnsureSubscriptionActive` middleware
3. Add `VerifyInternalWebhookSecret` middleware
4. Run `DemoBusinessSeeder` for local dev


---

## MVP Phases Overview

| Phase | Focus | Status |
|---|---|---|
| 1 | Backend Foundation | ✅ In Progress |
| 2 | Core Booking Logic | 🔲 Not Started |
| 3 | Owner/Staff API | 🔲 Not Started |
| 4 | Frontend Foundation | 🔲 Not Started |
| 5 | Dashboard Frontend | 🔲 Not Started |
| 6 | Owner Management Screens | 🔲 Not Started |
| 7 | n8n / WhatsApp Integration | 🔲 Not Started |
| 8 | Polish + First Onboarding | 🔲 Not Started |

Status keys: 🔲 Not Started | 🟡 In Progress | ✅ Complete | 🔴 Blocked

---

## Phase 1 — Backend Foundation

**Goal:** Laravel 13 project running, DB connected, all migrations applied,
models and scopes in place, Sanctum auth scaffolded.

### Tasks
- [x] Create Laravel 13 project (`composer create-project laravel/laravel`)
- [x] Set PHP 8.3 minimum in `composer.json`
- [x] Configure `.env` (PostgreSQL, APP_URL, queue driver = database)
- [x] Install Laravel Sanctum (`php artisan install:api`)
- [x] Create migrations for all tables (from Phase 5 schema):
  - [x] `users`
  - [x] `businesses`
  - [x] `branches`
  - [x] `branch_working_hours`
  - [x] `staff`
  - [x] `staff_working_hours`
  - [x] `services`
  - [x] `staff_services` (pivot)
  - [x] `customers`
  - [x] `otp_codes`
  - [x] `bookings`
  - [x] `notifications_log`
- [x] Create all Eloquent models with relationships
- [x] Create `BusinessScope` global scope (auto-filter by `business_id`)
- [x] Apply `BusinessScope` to: `Branch`, `Staff`, `Service`, `Customer`, `Booking`
- [x] Create `User` model roles enum (`owner`, `staff`, `admin`)
- [x] Configure `api.php` with versioned route file includes
- [x] Create route files: `public.php`, `auth.php`, `owner.php`, `staff.php`,
      `customer.php`, `admin.php`, `internal.php`
 - [x] Add `EnsureUserHasRole` middleware
 - [x] Add `EnsureSubscriptionActive` middleware
 - [x] Add `VerifyInternalWebhookSecret` middleware
 - [x] Run `DemoBusinessSeeder` for local dev (created seeder and updated DatabaseSeeder)

---

## Recent Activity

- Completed: Implemented three middleware (`EnsureUserHasRole`, `EnsureSubscriptionActive`, `VerifyInternalWebhookSecret`), registered aliases in `bootstrap/app.php`, and added `internal_webhook_secret` to `config/services.php`.
- Completed: Added `DemoBusinessSeeder` and updated `DatabaseSeeder::run()` to prompt for seeding demo data.
- Next: Run `php artisan db:seed --class=DemoBusinessSeeder` in `backend` (or `php artisan migrate:fresh --seed` and answer `y`).

---

## Phase 2 — Core Booking Logic

**Goal:** Availability engine and booking creation working with full
conflict prevention and "any available" staff assignment.

### Tasks
- [ ] Create `AvailabilityService` (slot generation logic)
  - [ ] Generate slots from `branch_working_hours` + `staff_working_hours`
  - [ ] Filter out slots blocked by existing `bookings` (conflict query)
  - [ ] Handle `service.duration_minutes` for slot length
  - [ ] Handle "any available" — find first free staff for requested service + slot
- [ ] Create `AvailabilityRepository` (raw conflict query with composite index)
- [ ] Create `CreateBookingAction`
  - [ ] Validate slot still available (re-check inside transaction)
  - [ ] Assign specific staff OR call "any available" logic
  - [ ] Create booking row
  - [ ] Fire `BookingCreated` event
- [ ] Create `AssignAvailableStaffAction`
- [ ] Create `CancelBookingAction` (update status + fire `BookingCancelled`)
- [ ] Create `MarkBookingCompletedAction`
- [ ] Create `MarkBookingNoShowAction` (update status + increment `customer.visit_count`... wait, no-show doesn't increment)
- [ ] Register `BookingCreated` → `DispatchBookingConfirmationJob` listener
- [ ] Register `UpdateCustomerVisitStats` on `BookingCompleted`
- [ ] Write feature tests:
  - [ ] `CreateBookingTest` — happy path
  - [ ] `AvailabilityConflictTest` — double-booking attempt rejected
  - [ ] `AnyAvailableStaffAssignmentTest`
- [ ] Write unit test: `AvailabilityServiceTest`

---

## Phase 3 — Owner/Staff API

**Goal:** All CRUD endpoints for branches, staff, services, bookings,
customers — secured by Sanctum + role policies.

### Tasks
- [ ] Auth endpoints:
  - [ ] `POST /auth/register` (owner signup)
  - [ ] `POST /auth/login` (owner/staff password)
  - [ ] `POST /auth/otp/send` (customer OTP)
  - [ ] `POST /auth/otp/verify`
  - [ ] `POST /auth/logout`
- [ ] Owner endpoints:
  - [ ] Branches CRUD
  - [ ] Staff CRUD + working hours
  - [ ] Services CRUD + staff assignment
  - [ ] Bookings (list, create manual, update status)
  - [ ] Customers (list, detail)
  - [ ] Settings (business profile update)
- [ ] Staff endpoints:
  - [ ] `GET /staff/schedule` (own bookings for day/week)
  - [ ] `PATCH /staff/bookings/{id}/status`
- [ ] Customer endpoints:
  - [ ] `GET /customer/bookings`
  - [ ] `DELETE /customer/bookings/{id}` (cancel)
- [ ] Public endpoints:
  - [ ] `GET /public/business/{slug}` (business + branches)
  - [ ] `GET /public/business/{slug}/branches/{branchSlug}`
  - [ ] `GET /public/branches/{id}/services`
  - [ ] `GET /public/branches/{id}/staff`
  - [ ] `GET /public/availability` (available slots)
  - [ ] `POST /public/bookings` (create booking, includes OTP gate)
- [ ] Admin endpoints:
  - [ ] `GET /admin/businesses`
  - [ ] `PATCH /admin/businesses/{id}/subscription`
- [ ] Internal (n8n):
  - [ ] `GET /internal/bookings/due-reminders`
  - [ ] `POST /internal/notifications/{id}/sent`
- [ ] Create all Form Request classes
- [ ] Create all API Resource classes
- [ ] Create all Policy classes
- [ ] Write authorization test: `StaffCannotAccessOtherStaffScheduleTest`

---

## Phase 4 — Frontend Foundation

**Goal:** Next.js project running, i18n/RTL configured, design system
applied, auth screens working, public booking flow complete.

### Tasks
- [ ] Create Next.js project (`create-next-app` with TypeScript + App Router)
- [ ] Install and configure `next-intl` (Arabic default, `dir="rtl"`)
- [ ] Install and configure Tailwind CSS + Neumorphism CSS variables in globals.css
- [ ] Install and configure shadcn/ui (customize to Neumorphism as per ui-context.md)
- [ ] Install Cairo + Tajawal fonts (Google Fonts)
- [ ] Create `api-client.ts` (Axios instance, base URL, token interceptor)
- [ ] Create `query-client.ts` (TanStack Query)
- [ ] Create Arabic locale messages file (`ar.json`) — all UI strings
- [ ] Create middleware.ts (route protection + locale detection)
- [ ] Auth screens:
  - [ ] `/login` — owner/staff login
  - [ ] `/register` — owner registration
- [ ] Public booking flow:
  - [ ] `/book/[businessSlug]/[branchSlug]` — service selection
  - [ ] `/book/.../staff` — barber selection
  - [ ] `/book/.../time` — slot picker
  - [ ] `/book/.../confirm` — name + phone + OTP
  - [ ] `/book/.../success` — confirmation screen
- [ ] Landing page (simplified, single page)
- [ ] Pricing page

---

## Phase 5 — Dashboard Frontend

**Goal:** Calendar, bookings list, customer list, and manual booking modal
all functional and connected to the real API.

### Tasks
- [ ] Dashboard layout: sidebar, branch switcher, header
- [ ] Dashboard overview page (today's stats cards)
- [ ] Calendar page (FullCalendar integration):
  - [ ] Day view
  - [ ] Week view
  - [ ] Resource/staff column view (owner)
  - [ ] Single-column view (staff)
  - [ ] Click slot → manual booking modal
  - [ ] Click booking → booking detail popover
- [ ] Manual booking modal (customer search/create, service, staff, time)
- [ ] Bookings list page (table + status filters)
- [ ] Customer list page (search, visit count)
- [ ] Customer detail page (booking history)
- [ ] My Bookings page (customer-facing, OTP auth)

---

## Phase 6 — Owner Management Screens

**Goal:** Full CRUD for branches, staff, and services, plus settings page.

### Tasks
- [ ] Branches list + create/edit forms
- [ ] Branch working hours editor (per weekday, open/close time)
- [ ] Staff list + create/edit forms
- [ ] Staff working hours editor
- [ ] Staff login credentials creator (owner sets username + password)
- [ ] Services list + create/edit forms
- [ ] Service ↔ staff assignment UI
- [ ] Settings page:
  - [ ] Business profile (name, logo upload, description)
  - [ ] Subscription status badge
  - [ ] Account password change
- [ ] Admin pages:
  - [ ] Business list with subscription status
  - [ ] Business detail + subscription activation form

---

## Phase 7 — n8n / WhatsApp Integration

**Goal:** WhatsApp confirmation and reminder messages working end-to-end.

### Tasks
- [ ] Set up WhatsApp Business Cloud API (Meta)
- [ ] **Submit message templates for Meta approval** (do this as early as possible — can take days)
  - [ ] Booking confirmation template (Arabic)
  - [ ] Appointment reminder template (Arabic)
  - [ ] Cancellation notification template (Arabic)
- [ ] Set up n8n instance (n8n Cloud or self-hosted)
- [ ] Create n8n workflow #1: Booking Confirmation
  - [ ] Webhook trigger from Laravel
  - [ ] Format Arabic message with variables
  - [ ] WhatsApp Cloud API send node
  - [ ] Laravel callback on success/failure
  - [ ] Retry node (3x exponential backoff)
- [ ] Create n8n workflow #2: Appointment Reminder
  - [ ] Cron trigger (every 15 min)
  - [ ] HTTP request to `GET /internal/bookings/due-reminders`
  - [ ] Loop + send per booking
  - [ ] Per-item failure handling
- [ ] Create n8n sub-workflow #3: WhatsApp Delivery (shared)
- [ ] Implement `N8nWebhookService` in Laravel (builds payloads, sends to n8n)
- [ ] Implement `SendBookingConfirmationWebhook` job
- [ ] Implement `SendReminderWebhook` job
- [ ] Implement `DueRemindersController` + query
- [ ] Test end-to-end with a real WhatsApp number

---

## Phase 8 — Polish + First Onboarding

**Goal:** Bug fixes, admin subscription flow working, first real shops onboarded.

### Tasks
- [ ] Fix all bugs from Phase 7 testing
- [ ] Mobile responsiveness audit (assume 90%+ mobile usage)
- [ ] RTL visual QA (shadow directions, icon mirroring, text alignment)
- [ ] Admin subscription activation flow tested
- [ ] Trial expiry job tested (`ExpireSubscriptionsJob`)
- [ ] `EnsureSubscriptionActive` middleware edge cases tested
- [ ] Onboard shop #1 — full walkthrough, collect feedback
- [ ] Onboard shop #2 — observe setup, note pain points
- [ ] Fix top issues from shop feedback
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to production (Forge + DigitalOcean or Railway)
- [ ] Production Postgres provisioned (managed)
- [ ] n8n production instance running
- [ ] All env vars set in production
- [ ] SSL/HTTPS confirmed on all domains

---

## Blockers Log

| Date | Blocker | Status |
|---|---|---|
| — | None yet | — |

---

## Session Log

| Date | Session Summary | Files Touched |
|---|---|---|
| 2026-06-23 | Implemented `02-Models + Relationships + Multi-Tenancy.md`: Eloquent models, relationships, tenant `BusinessScope`, Sanctum-ready auth entities, and backed enums. Verified with PHPUnit, Pint, and PHP syntax checks. PHPStan analyse currently exits non-zero without diagnostics and needs follow-up investigation. | [progress-tracker.md](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/Context/progress-tracker.md), [User.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/User.php), [BusinessScope.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/Scopes/BusinessScope.php), [Business.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/Business.php), [Branch.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/Branch.php), [Staff.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/Staff.php), [Service.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/Service.php), [Booking.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/Booking.php), [Customer.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/Customer.php), [OtpCode.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/OtpCode.php), [BranchWorkingHour.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/BranchWorkingHour.php), [StaffWorkingHour.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/StaffWorkingHour.php), [NotificationLog.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Models/NotificationLog.php), [Enums](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/app/Enums) |
| 2026-06-23 | Implemented `01-create-tables.md`: Laravel PostgreSQL UUID migrations for all Booking SaaS core tables, native enum types, foreign keys, required indexes, soft deletes, and booking partial index. Verified migrate + rollback in temporary PostgreSQL database. | [progress-tracker.md](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/Context/progress-tracker.md), [0001_01_01_000000_create_users_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/0001_01_01_000000_create_users_table.php), [2026_06_23_120000_create_businesses_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120000_create_businesses_table.php), [2026_06_23_120001_create_branches_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120001_create_branches_table.php), [2026_06_23_120002_create_branch_working_hours_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120002_create_branch_working_hours_table.php), [2026_06_23_120003_create_staff_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120003_create_staff_table.php), [2026_06_23_120004_create_staff_working_hours_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120004_create_staff_working_hours_table.php), [2026_06_23_120005_create_services_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120005_create_services_table.php), [2026_06_23_120006_create_staff_services_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120006_create_staff_services_table.php), [2026_06_23_120007_create_customers_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120007_create_customers_table.php), [2026_06_23_120008_create_otp_codes_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120008_create_otp_codes_table.php), [2026_06_23_120009_create_bookings_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120009_create_bookings_table.php), [2026_06_23_120010_create_notifications_log_table.php](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/backend/database/migrations/2026_06_23_120010_create_notifications_log_table.php) |
| 2026-06-23 | Project setup initialized. Saved specification to setup-project.md and updated progress tracker. | [progress-tracker.md](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/Context/progress-tracker.md), [setup-project.md](file:///Users/ahmedgomaa/Documents/Projects/Onlin%20Booking/Context/feature-specs/setup-project.md) |
