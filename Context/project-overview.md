# Project Overview
# Booking SaaS — Barbershop & Men's Salon Appointment Platform

---

## Overview

A subscription-based SaaS booking and appointment management platform built
specifically for **barbershops and men's salons in Egypt**, with planned expansion
to the wider GCC (Saudi Arabia, UAE).

The platform replaces chaotic WhatsApp-based booking with a structured, branded
online booking system that business owners can share as a link (e.g. on their
Instagram bio or WhatsApp status) and that sends automatic WhatsApp reminders to
reduce no-shows — the primary revenue leak for service businesses.

**This is a SaaS tool, not a marketplace.** Each business gets its own isolated
booking environment with its own branded public link. There is no public search or
discovery layer in the MVP.

---

## The Problem We're Solving

Egyptian barbershop owners currently manage all bookings via WhatsApp messages and
phone calls. This causes:

1. **Double-booking** — no central calendar, two customers booked for the same barber
   at the same time happens constantly.
2. **No-shows** — no automated reminders, customers forget and the chair sits empty
   (a perishable revenue slot that can never be recovered).
3. **No visibility** — multi-branch owners have no unified view across locations.
4. **No customer history** — can't identify regulars, lapsed customers, or preferences.
5. **Unprofessional experience** — high-quality salons still run on manual WhatsApp threads.

**The core value proposition:**
> "Replace your WhatsApp booking mess with a real calendar and automatic
>  WhatsApp reminders — in Arabic, built for your shop."

---

## Goals

### Business Goals
- Onboard 10–15 Cairo barbershops as paying customers within 2 months of launch.
- Achieve measurable reduction in no-show rate for early adopters (target: track
  before/after and use as sales proof point).
- Reach product-market fit signal: >80% week-4 retention of onboarded shops.
- Lay the technical foundation to expand to GCC and add marketplace discovery later.

### Product Goals (MVP)
- Let any barbershop set up a working online booking page in under 30 minutes.
- Automate WhatsApp booking confirmation and pre-appointment reminder with zero
  manual effort from the shop owner.
- Give owners a real-time calendar view replacing their WhatsApp thread.
- Give barbers a simple daily schedule view on their phone.

### Technical Goals
- Arabic-first RTL product usable on mobile as the primary device.
- Multi-tenant architecture from day one — clean data isolation between businesses.
- Solid booking conflict prevention — zero double-bookings is a hard requirement.
- Easily extensible: adding online payments, marketplace search, or new notification
  channels should not require architectural rework.

---

## Core User Flow

### Customer Booking Flow
```
Share Link (Instagram bio / WhatsApp status)
  ↓
Business/Branch Landing Page (Arabic RTL)
  ↓
Select Service (name, duration, price shown)
  ↓
Select Barber (specific person) OR "Any Available"
  ↓
Select Date → Available Time Slots (booked slots hidden entirely)
  ↓
Enter Name + Phone Number
  ↓
OTP Verification (WhatsApp or SMS)
  ↓
Booking Confirmed → Confirmation WhatsApp message sent
  ↓
[Later] WhatsApp Reminder sent X hours before appointment
  ↓
[Later] Customer can view/cancel via "My Bookings" (phone + OTP login)
```

### Business Owner Setup Flow
```
Sign Up → Create Business Profile (name, logo)
  ↓
Create Branch(es) (address, WhatsApp number, working hours)
  ↓
Add Staff per branch (name, photo, working hours, days off)
  ↓
Add Services (name, duration, price, assign eligible staff)
  ↓
Copy Booking Link per branch → Share on Instagram/WhatsApp status
  ↓
Dashboard: View calendar (day/week), add walk-in bookings manually
  ↓
Customer list grows automatically with each booking
```

### Staff Daily Flow
```
Staff Login (username + password set by owner)
  ↓
View own schedule for today / this week
  ↓
Mark appointment as Completed or No-Show
  ↓
(No access to other staff schedules or business settings)
```

---

## Features

### MVP Features (Build Now)

#### Business Management
- [ ] Business profile (name, logo, description, slug for public URL)
- [ ] Multiple branches per business (address, city, WhatsApp number, working hours)
- [ ] Shareable public booking link per branch: `yourdomain.com/book/{businessSlug}/{branchSlug}`

#### Staff Management
- [ ] Add/edit/deactivate staff members per branch
- [ ] Assign services each staff member can perform
- [ ] Set working hours per staff member per weekday
- [ ] Mark individual days off
- [ ] Create login credentials for each staff member (username + password)

#### Services
- [ ] Add/edit/deactivate services per branch
- [ ] Service fields: name (Arabic), duration (minutes), price (EGP, reference only)
- [ ] Assign which staff members can perform each service

#### Public Booking Flow
- [ ] Service selection step
- [ ] Staff selection step (specific barber OR "Any Available")
- [ ] Date + time slot selection (only available slots shown)
- [ ] Customer name + phone entry
- [ ] OTP verification (creates/authenticates customer account)
- [ ] Booking confirmation screen + WhatsApp confirmation message

#### Booking Management (Dashboard)
- [ ] Calendar view: day and week modes
- [ ] Staff column (resource) view for owners — see all barbers side by side
- [ ] Manual booking entry (walk-in / phone call bookings added by owner/staff)
- [ ] Booking detail: service, barber, customer, time, status
- [ ] Status updates: Confirmed → Completed or No-Show
- [ ] Cancel booking (with WhatsApp notification to customer)
- [ ] Bookings list view with status filters

#### Customer Management
- [ ] Auto-created customer profile on first booking (phone = unique key per business)
- [ ] Customer list with search by name/phone
- [ ] Visit count and last visit date
- [ ] Booking history per customer
- [ ] My Bookings page (customer-facing, phone + OTP login)

#### Notifications (WhatsApp via n8n)
- [ ] Booking confirmation message (immediate, on booking creation)
- [ ] Appointment reminder message (configurable lead time, e.g. 3 hours before)
- [ ] Booking cancellation notification

#### Platform Admin (internal — for you)
- [ ] View all registered businesses
- [ ] View subscription status per business
- [ ] Manually activate/extend subscription (after confirming Instapay/bank payment)
- [ ] Deactivate suspended accounts

#### Subscription
- [ ] Trial period on signup (e.g. 14–30 days)
- [ ] `subscription_status`: trial / active / expired / suspended
- [ ] Dashboard shows subscription status + expiry date to owner
- [ ] `EnsureSubscriptionActive` middleware blocks dashboard actions when expired
  (public booking pages continue working even if subscription lapses)

---

### Phase 2 Features (Post-MVP — After First Paying Cohort)
- [ ] Analytics: no-show rate, booking volume, busiest hours/days
- [ ] Missed appointment follow-up WhatsApp automation
- [ ] Customer review/rating requests after completed booking
- [ ] Paymob/Fawry integration for automated subscription billing
- [ ] Reschedule flow (vs. current cancel + rebook shortcut)
- [ ] Tiered subscription plans (by branch count or booking volume)
- [ ] SMS fallback channel when WhatsApp delivery fails
- [ ] Reports export (CSV)

### Phase 3 Features (Scale)
- [ ] Public marketplace / discovery search
- [ ] GCC expansion (Saudi, UAE) — currency, localization, WhatsApp number support
- [ ] English language toggle (architecture already supports via next-intl)
- [ ] Online customer payments / deposits (reduce no-shows further)
- [ ] Marketing automation: rebooking nudges, re-engagement for lapsed customers
- [ ] Native mobile apps (iOS/Android) — only if web data justifies

---

## Authentication and Access

### Roles
| Role | Who | Auth Method |
|---|---|---|
| `owner` | Business owner | Email or phone + password |
| `staff` | Individual barber/employee | Username + password (set by owner) |
| `admin` | Platform operator (you) | Email + password, separate admin role flag |
| `customer` | End customer booking | Phone + OTP only (no password ever) |

### Auth Rules
- **Customers** never set a password — OTP via WhatsApp/SMS is their only auth method.
- **Staff** credentials are created by the owner in the dashboard — staff cannot
  self-register.
- **Owners** can register themselves via the public /register page.
- **Admin** accounts are created manually (no public registration for admin).
- All auth is handled by **Laravel Sanctum** (API tokens).
- Next.js stores the token in httpOnly cookies.

### Authorization
- Owners can manage everything within their own `business_id`.
- Staff can only view their own schedule and mark their own bookings.
- No staff member can view another staff member's bookings.
- No business can access another business's data (enforced by `BusinessScope` global
  Eloquent scope on every tenant-owned model).

---

## Collaborative Canvas / Multi-Branch

The "canvas" in this product is the **owner's dashboard calendar** — the central
coordination surface where all branches and staff are visible simultaneously.

- Branch switcher in the dashboard sidebar lets owners toggle between locations.
- In "all branches" view, the calendar shows aggregated bookings across locations
  with branch color-coding.
- Staff column view (resource view) shows all barbers side by side for a given
  branch — owners see at a glance who is free and who is busy.
- Manual booking modal is accessible directly from any calendar slot by clicking it.

---

## System Design Summary

### Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router, TypeScript) |
| UI Library | shadcn/ui + Tailwind CSS (Neumorphism customized) |
| Calendar | FullCalendar (React) |
| State | TanStack Query (server) + Zustand (client) |
| Forms | React Hook Form + Zod |
| i18n | next-intl (Arabic default, English ready) |
| Backend | Laravel 13 (PHP 8.3+), pure API mode |
| Auth | Laravel Sanctum |
| Database | PostgreSQL (managed) |
| Automation | n8n (WhatsApp notifications, reminders) |
| WhatsApp | Meta WhatsApp Business Cloud API |
| Deployment | Vercel (frontend) + Forge/DigitalOcean (backend) |

### Multi-tenancy
- Single shared PostgreSQL database.
- Every tenant-owned table has a `business_id` foreign key.
- Global Eloquent scope (`BusinessScope`) auto-applies `WHERE business_id = ?`
  to every query based on the authenticated user's business.

### Conflict Prevention (Critical)
- A booking is only accepted after a DB-level conflict check:
  `WHERE staff_id = X AND starts_at < new_end AND ends_at > new_start AND status = 'confirmed'`
- Wrapped in a PostgreSQL transaction with row-level locking to prevent race conditions
  when two customers book the same slot simultaneously.

---

## Starter System Designs

### Public Booking Page URL Structure
```
/book/{businessSlug}                   → redirects to first/default branch
/book/{businessSlug}/{branchSlug}      → service selection (step 1)
/book/{businessSlug}/{branchSlug}/staff  → barber selection (step 2)
/book/{businessSlug}/{branchSlug}/time   → time slot (step 3)
/book/{businessSlug}/{branchSlug}/confirm → OTP + confirm (step 4)
/book/{businessSlug}/{branchSlug}/success → confirmation screen
```

### API Route Structure
```
/api/v1/public/*          → unauthenticated (booking flow)
/api/v1/auth/*            → login, register, OTP
/api/v1/owner/*           → owner-only CRUD (requires role=owner)
/api/v1/staff/*           → staff schedule view (requires role=staff)
/api/v1/customer/*        → customer bookings (requires OTP auth)
/api/v1/admin/*           → platform admin (requires role=admin)
/api/v1/internal/*        → n8n webhooks (shared secret, not user auth)
```

---

## Spec Generation Notes

- Public booking pages are **Server Components** (Next.js SSR) for fast load on
  mobile data connections.
- Dashboard is **Client Components** with TanStack Query for real-time calendar updates.
- WhatsApp templates must be pre-approved by Meta before sending — submit early.
- All date/time stored in UTC in the database; displayed in `Africa/Cairo` (UTC+3)
  in the frontend.
- Service `duration_minutes` drives all slot calculation logic in `AvailabilityService`.
- `ends_at` is stored (not just `starts_at`) in `bookings` for fast conflict queries.

---

## Scope

### In Scope for MVP
- Business profile, multi-branch, staff, services CRUD
- Public booking flow (4-step, mobile-first, RTL)
- Customer phone + OTP authentication
- Calendar and list views (day/week, owner/staff)
- Manual booking entry (walk-ins)
- WhatsApp confirmation + reminder notifications via n8n
- Customer list + visit history
- Platform admin subscription management (manual)

### Out of Scope for MVP
- Marketplace / public discovery
- Online customer payments
- Reschedule flow
- SMS / email channels
- Reviews and ratings
- Advanced analytics / reports
- Native mobile apps
- Marketing automation
- Loyalty programs
- Multi-language (English)

---

## Success Criteria

### MVP Launch (Month 1–2)
- [ ] 10–15 Cairo barbershops onboarded and active.
- [ ] Zero double-bookings reported (conflict prevention working).
- [ ] WhatsApp confirmations and reminders delivered successfully for >95% of bookings.
- [ ] Average setup time (signup → first booking page live) under 30 minutes.

### Retention Check (Month 3)
- [ ] >80% of onboarded shops still active at week 4.
- [ ] At least 3 shops can provide a measurable before/after no-show rate.
- [ ] At least 1 case study ready for use as a sales proof point.

### Commercial (Month 3–4)
- [ ] First shops converted to paid subscription after trial.
- [ ] Instapay/bank transfer collection process working without friction.
- [ ] Pricing validated (owners willing to pay at set price point without heavy negotiation).
