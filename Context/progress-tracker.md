# Progress Tracker
# Booking SaaS — Barbershop Appointment Platform

> **AI Instructions:**
> Update this file at the end of every coding session or whenever the
> current phase, active feature, or implementation state changes.
> Always update "Current Status", "Last Completed", and "Next Up" sections.
> Never delete history — append to the log at the bottom.

---

## Current Status

**Phase:** 3 — Owner/Staff API ✅ Complete
**Active Feature:** Phase 4 — Frontend Foundation
**Last Session:** Implemented all API controllers, route files, form requests, OtpService, updated resources, and verified all 56 routes resolve
**Build Week:** 4 of 8

---

## Last Completed
- Created Eloquent models for `Business`, `Branch`, `Staff`, `Service`, `Booking`, `Customer`, `OtpCode`, working hours, and `NotificationLog`
- Added all specified relationships, UUID usage, fillable fields, casts, and soft deletes where required
- Added `BusinessScope` and applied it to `Branch`, `Staff`, `Service`, `Customer`, and `Booking`
- Added backed enums for `UserRole`, subscription status, booking status/source, and notification fields
- Updated `User` for Sanctum API tokens, UUIDs, role casting, and business/staff/owned-business relationships
- Verified Phase 1 setup basics are complete: Laravel 13 app, PHP 8.3 minimum, PostgreSQL/database queue env config, Sanctum dependency, versioned API route includes, and route files
- Implemented Availability repository and service for slot generation and conflict detection
- Added booking actions: `CreateBookingAction`, `AssignAvailableStaffAction`, `CancelBookingAction`, `MarkBookingCompletedAction`, `MarkBookingNoShowAction`
- Added `CreateBookingData` DTO and `SlotNotAvailableException`
- Added events: `BookingCreated`, `BookingCancelled` and listener `DispatchBookingConfirmationJob`
- Implemented three middleware (`EnsureUserHasRole`, `EnsureSubscriptionActive`, `VerifyInternalWebhookSecret`), registered aliases in `bootstrap/app.php`, and added `internal_webhook_secret` to `config/services.php`
- Created all **Form Request** classes (namespaced subdirs): `Auth/LoginRequest`, `Auth/RegisterRequest`, `Auth/SendOtpRequest`, `Auth/VerifyOtpRequest`, `Booking/StorePublicBookingRequest`, `Booking/CheckAvailabilityRequest`, `Branch/StoreBranchRequest`, `Branch/UpdateBranchRequest`, `Branch/UpdateWorkingHoursRequest`
- Created all **API Resource** classes (7 total): `BusinessResource`, `BranchResource`, `StaffResource`, `ServiceResource`, `BookingResource`, `CustomerResource`, `UserResource`
- Created all **Policy** classes (5 total): `BusinessPolicy`, `BranchPolicy`, `StaffPolicy`, `ServicePolicy`, `BookingPolicy` and registered them in `AppServiceProvider`
- Created all authorization and functional tests (4 total): `StaffCannotAccessOtherStaffScheduleTest`, `OwnerCannotAccessOtherBusinessDataTest`, `ExpiredSubscriptionPreventsBookingTest`, `CustomerCannotCancelPastBookingTest`
- Implemented **all 19 controllers** across Public, Auth, Owner, Staff, Customer, Admin, and Internal namespaces
- Replaced all route file stubs with full spec-compliant routes (7 route files, 56 total routes)
- Implemented `OtpService` (generate + verify OTP backed by `otp_codes` table)
- Added `notificationLogs()` relationship to `Booking` model
- Verified all routes resolve cleanly via `php artisan route:list`

---

## Next Up
1. Write feature tests for all new endpoints
2. Setup frontend Next.js project with TypeScript, TailwindCSS, and next-intl (Phase 4)
3. Build auth screens: `/login`, `/register`
4. Build public booking flow: service selection → staff → slot picker → confirm (OTP) → success
5. Dashboard layout + overview page


---

## MVP Phases Overview

| Phase | Focus | Status |
|---|---|---|
| 1 | Backend Foundation | ✅ Complete |
| 2 | Core Booking Logic | ✅ Complete |
| 3 | Owner/Staff API | ✅ Complete |
| 4 | Frontend Foundation | 🟡 In Progress |
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
- Completed: Implemented core booking pieces (repository, service, actions, DTO, events, listener). Files created:
  - backend/app/Repositories/AvailabilityRepository.php
  - backend/app/Services/AvailabilityService.php
  - backend/app/Data/CreateBookingData.php
  - backend/app/Actions/Bookings/CreateBookingAction.php
  - backend/app/Actions/Bookings/AssignAvailableStaffAction.php
  - backend/app/Actions/Bookings/CancelBookingAction.php
  - backend/app/Actions/Bookings/MarkBookingCompletedAction.php
  - backend/app/Actions/Bookings/MarkBookingNoShowAction.php
  - backend/app/Events/BookingCreated.php
  - backend/app/Events/BookingCancelled.php
  - backend/app/Listeners/DispatchBookingConfirmationJob.php
  - backend/app/Exceptions/SlotNotAvailableException.php
  - backend/app/Providers/EventServiceProvider.php
- Next: Wire the `SendBookingConfirmationWebhook` job and run the booking feature tests.

- Completed: Added `BookingCompleted` event, `UpdateCustomerVisitStats` listener, registered them in `EventServiceProvider.php`, updated `MarkBookingCompletedAction` to fire the event, and added Phase 2 tests (feature + unit).

---

## Phase 2 — Core Booking Logic

**Goal:** Availability engine and booking creation working with full
conflict prevention and "any available" staff assignment.

### Tasks
- [x] Create `AvailabilityService` (slot generation logic)
  - [x] Generate slots from `branch_working_hours` + `staff_working_hours`
  - [x] Filter out slots blocked by existing `bookings` (conflict query)
  - [x] Handle `service.duration_minutes` for slot length
  - [x] Handle "any available" — find first free staff for requested service + slot
- [x] Create `AvailabilityRepository` (raw conflict query with composite index)
- [x] Create `CreateBookingAction`
  - [x] Validate slot still available (re-check inside transaction)
  - [x] Assign specific staff OR call "any available" logic
  - [x] Create booking row
  - [x] Fire `BookingCreated` event
- [x] Create `AssignAvailableStaffAction`
- [x] Create `CancelBookingAction` (update status + fire `BookingCancelled`)
- [x] Create `MarkBookingCompletedAction`
- [x] Create `MarkBookingNoShowAction` (update status; no-show does not increment visit count)
- [x] Register `BookingCreated` → `DispatchBookingConfirmationJob` listener
- [x] Write feature tests:
 - [x] Register `BookingCreated` → `DispatchBookingConfirmationJob` listener
 - [x] Register `UpdateCustomerVisitStats` on `BookingCompleted`
 - [x] Write feature tests:
  - [x] `CreateBookingTest` — happy path
  - [x] `AvailabilityConflictTest` — double-booking attempt rejected
  - [x] `AnyAvailableStaffAssignmentTest`
 - [x] Write unit test: `AvailabilityServiceTest`

---

## Phase 3 — Owner/Staff API

**Goal:** All CRUD endpoints for branches, staff, services, bookings,
customers — secured by Sanctum + role policies.

### Tasks
- [x] Auth endpoints:
  - [x] `POST /auth/register` (owner signup) → `RegisterController@store`
  - [x] `POST /auth/login` (owner/staff password) → `LoginController@store`
  - [x] `POST /auth/otp/send` (customer OTP) → `OtpController@send`
  - [x] `POST /auth/otp/verify` → `OtpController@verify`
  - [x] `POST /auth/logout` → `LoginController@destroy`
- [x] Owner endpoints:
  - [x] Branches CRUD + working hours + bookings → `Owner/BranchController`
  - [x] Staff CRUD + working hours + service assignment + login credentials → `Owner/StaffController`
  - [x] Services CRUD → `Owner/ServiceController`
  - [x] Bookings (list, create manual, update status, delete) → `Owner/BookingController`
  - [x] Customers (list, detail, booking history) → `Owner/CustomerController`
  - [x] Settings (business profile update) → `Owner/SettingsController`
  - [x] Dashboard overview stats → `Owner/DashboardController`
- [x] Staff endpoints:
  - [x] `GET /staff/schedule` + `GET /staff/schedule/{date}` → `Staff/ScheduleController`
  - [x] `PATCH /staff/bookings/{id}/completed` + `no-show`
- [x] Customer endpoints:
  - [x] `GET /customer/my-bookings` + `GET /customer/my-bookings/{id}` + `DELETE` (cancel)
- [x] Public endpoints:
  - [x] `GET /public/business/{slug}` (business + branches) → `Public/BranchController@showBusiness`
  - [x] `GET /public/business/{businessSlug}/branches/{branchSlug}` → `@show`
  - [x] `GET /public/branches/{id}/services` → `@services`
  - [x] `POST /public/availability/check` → `Public/AvailabilityController@check`
  - [x] `POST /public/bookings` → `Public/BookingController@store`
- [x] Admin endpoints:
  - [x] `GET /admin/overview` → `Admin/OverviewController@index`
  - [x] `GET /admin/businesses` + `/{id}` + `/subscription` + `/status` → `Admin/BusinessController`
- [x] Internal (n8n):
  - [x] `GET /internal/bookings/due-reminders` → `Internal/DueRemindersController@index`
  - [x] `POST /internal/notifications/{id}/sent` + `/failed` → `Internal/NotificationCallbackController`
- [x] Create all Form Request classes (namespaced): Auth/*, Booking/*, Branch/*
- [x] Create all API Resource classes (7 total): +UserResource, updated BranchResource & BookingResource
- [x] Create all Policy classes (5 total): BusinessPolicy, BranchPolicy, StaffPolicy, ServicePolicy, BookingPolicy
- [x] Write authorization tests (4 total): StaffCannotAccessOtherStaffScheduleTest, OwnerCannotAccessOtherBusinessDataTest, ExpiredSubscriptionPreventsBookingTest, CustomerCannotCancelPastBookingTest
- [x] Implement `OtpService` (sendOtp / verifyOtp)
- [x] Add `notificationLogs()` relation to Booking model
- [x] Verify all 56 routes resolve via `php artisan route:list`

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
| 2026-06-24 | Implemented Phase 3 API Specifications: Created 7 Form Requests (RegisterOwnerRequest, LoginRequest, SendOtpRequest, CreateBookingRequest, StoreBranchRequest, StoreStaffRequest, SetWorkingHoursRequest, StoreServiceRequest), 6 API Resources (BusinessResource, BranchResource, StaffResource, ServiceResource, BookingResource, CustomerResource), 5 Policies (BusinessPolicy, BranchPolicy, StaffPolicy, ServicePolicy, BookingPolicy), registered all policies in AppServiceProvider, and created 4 comprehensive authorization tests (StaffCannotAccessOtherStaffScheduleTest, OwnerCannotAccessOtherBusinessDataTest, ExpiredSubscriptionPreventsBookingTest, CustomerCannotCancelPastBookingTest). | Form Requests (7), Resources (6), Policies (5), Authorization Tests (4), AppServiceProvider.php |
| 2026-06-24 | Implemented BookingCompleted event + UpdateCustomerVisitStats listener, registered in EventServiceProvider, updated MarkBookingCompletedAction to dispatch event, and added feature/unit tests for Phase 2. | [backend/app/Events/BookingCompleted.php](backend/app/Events/BookingCompleted.php), [backend/app/Listeners/UpdateCustomerVisitStats.php](backend/app/Listeners/UpdateCustomerVisitStats.php), [backend/app/Providers/EventServiceProvider.php](backend/app/Providers/EventServiceProvider.php), [backend/app/Actions/Bookings/MarkBookingCompletedAction.php](backend/app/Actions/Bookings/MarkBookingCompletedAction.php), [backend/tests/Feature/Booking/CreateBookingTest.php](backend/tests/Feature/Booking/CreateBookingTest.php), [backend/tests/Feature/Booking/AvailabilityConflictTest.php](backend/tests/Feature/Booking/AvailabilityConflictTest.php), [backend/tests/Feature/Booking/AnyAvailableStaffAssignmentTest.php](backend/tests/Feature/Booking/AnyAvailableStaffAssignmentTest.php), [backend/tests/Unit/AvailabilityServiceTest.php](backend/tests/Unit/AvailabilityServiceTest.php) |
| 2026-06-24 | Implemented all Phase 3 API controllers & endpoints per `07-Controller & Endpoint.md`. Created 19 controllers, replaced 7 route file stubs, added 9 Form Requests in namespaced subdirs, added UserResource, updated BranchResource & BookingResource, implemented OtpService, added notificationLogs relation to Booking. All 56 routes verified via `php artisan route:list`. | [routes/api/v1/*.php](backend/routes/api/v1/), [Controllers/Api/V1/**](backend/app/Http/Controllers/Api/V1/), [Services/OtpService.php](backend/app/Services/OtpService.php), [Requests/Auth/](backend/app/Http/Requests/Auth/), [Requests/Booking/](backend/app/Http/Requests/Booking/), [Requests/Branch/](backend/app/Http/Requests/Branch/), [Resources/UserResource.php](backend/app/Http/Resources/UserResource.php), [Models/Booking.php](backend/app/Models/Booking.php) |
