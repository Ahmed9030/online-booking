# AI Workflow Rules
# Booking SaaS — Barbershop Appointment Platform

> These are strict operating rules for any AI assistant (GitHub Copilot,
> Cursor, Claude, etc.) working on this codebase. Read this file before
> generating any code, making any structural decision, or answering any
> architecture question.

---

## Rule 0 — Read Before You Write

Before generating code for any task, read the relevant context files:

| Task type | Must read first |
|---|---|
| Any UI component or screen | `ui-context.md` |
| Any new feature or flow | `project-overview.md` |
| Any new file/folder structure | `architecture-context.md` |
| Any function, class, or naming decision | `code-standards.md` |
| Starting a new coding session | `progress-tracker.md` |

Never generate code based on assumptions alone.
If the context files don't cover the case, **ask before generating**.

---

## Rule 1 — Update Progress Tracker Every Session

At the **end of every coding session**, update `progress-tracker.md`:

1. Move completed tasks from `[ ]` to `[x]`.
2. Update `Current Status` → current Phase + active feature.
3. Update `Last Completed` → what was just finished.
4. Update `Next Up` → the next 3–5 specific tasks.
5. Append a new row to the `Session Log` table at the bottom.
6. Add any new blockers to the `Blockers Log` table.

**Never skip this step.** The progress tracker is how context is preserved
across sessions.

---

## Rule 2 — Never Break the Architecture

The following architectural boundaries are **hard rules**, not suggestions:

### Frontend
- ✅ Public booking pages use **Server Components** (no `use client` at the page level).
- ✅ Dashboard pages use **Client Components** with **TanStack Query**.
- ✅ All API calls go through `services/api-client.ts` — no raw `fetch()` in components.
- ✅ All server state (bookings, staff, services) managed by TanStack Query.
- ✅ Zustand only for UI state that crosses component boundaries.
- ❌ Never import `axios` or `fetch` directly in a component file.
- ❌ Never put business logic in a page component — extract to a hook.
- ❌ Never use `localStorage` or `sessionStorage` — use httpOnly cookies.

### Backend
- ✅ Controllers must be thin (validate → call Action → return Resource).
- ✅ Business logic belongs in Action classes.
- ✅ Complex cross-entity logic belongs in Service classes.
- ✅ All responses must use API Resource classes — never return raw models.
- ✅ All queries on tenant-scoped models auto-filter via `BusinessScope`.
- ❌ Never write business logic in a Controller.
- ❌ Never return a raw Eloquent model from a controller.
- ❌ Never bypass `BusinessScope` without an explicit, commented reason.
- ❌ Never write raw SQL — use Eloquent query builder.

### Database
- ❌ Never hard-delete `bookings`, `staff`, `services`, or `branches` — soft delete only.
- ❌ Never store dates in non-UTC format in the database.
- ❌ Never create a migration without a `down()` method.

---

## Rule 3 — Follow the Neumorphism Design System

Every UI component must conform to `ui-context.md`. Specifically:

- All cards must use `shadow-neu` or `shadow-neu-flat` (Tailwind custom shadow).
- All buttons must have `shadow-neu-sm` at rest and `shadow-neu-inset` on active.
- All inputs must use `shadow-neu-inset` (pressed look).
- Background and surface colors must always be the same (`bg-surface` / `#E8EDF2`).
- No visible borders on neumorphic elements.
- No pure black or pure white shadows.
- RTL must be verified for every component (shadow directions are fine — CSS shadows
  are not directional — but text alignment, flex direction, padding, and icon
  orientation must be correct).

**When in doubt, refer to `ui-context.md` before styling anything.**

---

## Rule 4 — Arabic First, Always

- Every user-facing string must go through `next-intl` (`useTranslations()`).
- Never hardcode Arabic or English text in JSX.
- Never hardcode Arabic or English text in Laravel responses — use `__('key')`.
- When generating a new component, include the translation key structure in
  `ar.json` as part of the same task (don't leave strings as TODOs).
- All new translation keys follow dot-notation: `{domain}.{action}_{noun}`.
  - e.g., `booking.select_service`, `staff.mark_no_show`, `error.slot_taken`.

---

## Rule 5 — Security Boundaries Are Non-Negotiable

Never generate code that:
- Queries a tenant-scoped model without `BusinessScope` being active.
- Trusts a `business_id` sent from the client without server-side ownership verification.
- Skips OTP verification in the customer auth flow.
- Stores a secret, token, or credential in code (always use `.env`).
- Returns a raw Eloquent model (which may expose hidden fields or leak other tenants' data).
- Writes a migration without checking for unintended data exposure.

If a task seems to require bypassing these — **stop and ask** before generating.

---

## Rule 6 — File Placement Rules

Before creating a new file, verify its location:

| What | Where |
|---|---|
| React UI component | `components/{domain}/` |
| Page component | `app/[locale]/({group})/{route}/page.tsx` |
| TanStack Query hook | `features/{domain}/hooks/use-{name}.ts` |
| API call function | `features/{domain}/api/{domain}.api.ts` |
| Zod validation schema | `lib/validations/{domain}.schema.ts` |
| Domain TypeScript types | `features/{domain}/types.ts` |
| Shared/generic types | `types/models.types.ts` or `types/api.types.ts` |
| Laravel Controller | `app/Http/Controllers/Api/V1/{Group}/` |
| Laravel Action | `app/Actions/{Domain}/` |
| Laravel Service | `app/Services/` |
| Laravel Repository | `app/Repositories/` (only for complex queries) |
| Laravel Model | `app/Models/` |
| Laravel Policy | `app/Policies/` |
| Laravel Event | `app/Events/` |
| Laravel Job | `app/Jobs/` |
| Laravel Listener | `app/Listeners/` |
| Laravel Form Request | `app/Http/Requests/{Domain}/` |
| Laravel API Resource | `app/Http/Resources/` |
| Laravel Migration | `database/migrations/` |
| Arabic translations (Next.js) | `i18n/messages/ar.json` |
| Arabic translations (Laravel) | `lang/ar/` |
| Seeder | `database/seeders/` |
| Feature test | `tests/Feature/{Domain}/` |
| Unit test | `tests/Unit/` |

If unsure where something belongs → check `architecture-context.md` before creating.

---

## Rule 7 — The Booking Conflict Check Is Sacred

The availability/conflict check logic (`AvailabilityService::assertSlotAvailable`)
must **always** be:
1. Inside a `DB::transaction()`.
2. Applied before inserting any booking.
3. Using the correct SQL overlap condition:
   `starts_at < new_end AND ends_at > new_start`
   (not just `starts_at = new_start`).

Never simplify or skip this logic, even for manual/admin bookings.
Double-bookings are the most critical failure mode in this product.

---

## Rule 8 — Scope of Each Session

At the start of a session:
1. Read `progress-tracker.md` → understand current phase and what's done.
2. Identify the **single feature** being worked on this session.
3. Work only within that feature's scope — don't drift into adjacent features.
4. If a dependency is missing (e.g., an API endpoint needed by a frontend task
   isn't built yet), stop and flag it rather than mocking it permanently.

At the end of a session:
1. Update `progress-tracker.md` (see Rule 1).
2. If any technical debt or shortcuts were taken, add a comment in code:
   `// TODO: [Phase X] Replace this with proper implementation`
   and add a note to progress-tracker.md.

---

## Rule 9 — Don't Over-Build

This is an MVP with a 1–2 month solo build window.
When generating code, always ask:

> "Is this the simplest version that works correctly?"

If the answer is no — simplify first, then generate.

Signals that you're over-building:
- Adding config options for things that only have one use case right now.
- Creating abstract base classes for a single implementation.
- Building generic systems where a specific solution works.
- Adding Phase 2 features (reports, SMS, reviews) before Phase 1 is complete.

**The right call is always:** ship the correct simple version, then iterate.

---

## Rule 10 — Naming Is Documentation

Names must communicate intent without requiring a comment:

```php
// ✅ Clear
$action->handle(CreateBookingData::fromRequest($request));
assertSlotAvailable($staffId, $startsAt, $endsAt);

// ❌ Unclear
$action->run($data);
checkSlot($id, $time);
```

```tsx
// ✅ Clear
const { data: availableSlots, isLoading: isFetchingSlots } = useAvailableSlots(params)

// ❌ Unclear
const { data, isLoading } = useSlots(p)
```

If a name requires a comment to explain what it does, rename it.
Comments explain **why**, not **what**.

---

## Rule 11 — Generated Code Checklist

Before presenting generated code, verify:

**Frontend**
- [ ] Component uses CSS variables from `ui-context.md` — not hardcoded hex values.
- [ ] Component is RTL-compatible (text direction, flex, padding).
- [ ] All strings use `useTranslations()` — no hardcoded Arabic/English.
- [ ] TypeScript is strictly typed — no `any`, no missing return types.
- [ ] Form uses React Hook Form + Zod schema.
- [ ] API calls are in `features/{domain}/api/` not inside the component.

**Backend**
- [ ] File starts with `declare(strict_types=1)`.
- [ ] Controller is thin — no business logic.
- [ ] Action has a single `handle()` method.
- [ ] Response uses an API Resource.
- [ ] New model has `HasUuids` and correct `$fillable` + `$casts`.
- [ ] Policy exists and is registered for any new model.
- [ ] Migration has a `down()` method.
- [ ] No raw SQL — Eloquent query builder only.
- [ ] `BusinessScope` applied to any new tenant-scoped model.

**Both**
- [ ] Error cases handled (what happens if this fails?).
- [ ] No hardcoded secrets or credentials.
- [ ] Progress tracker updated after the session.

---

## Quick Reference — Key Files

| File | Purpose |
|---|---|
| `ui-context.md` | Design system, colors, shadows, component styles |
| `project-overview.md` | Product definition, features, flows, success criteria |
| `progress-tracker.md` | Current build state — update every session |
| `code-standards.md` | TypeScript + PHP conventions, naming, testing rules |
| `architecture-context.md` | System design, layer responsibilities, key decisions |
| `ai-workflow-rules.md` | This file — AI operating rules |

---

## Quick Reference — Critical Classes

| Class | Location | Role |
|---|---|---|
| `AvailabilityService` | `app/Services/AvailabilityService.php` | Slot generation + conflict checking — most critical class |
| `CreateBookingAction` | `app/Actions/Bookings/CreateBookingAction.php` | Booking creation + staff assignment + event dispatch |
| `BusinessScope` | `app/Scopes/BusinessScope.php` | Global Eloquent scope — multi-tenancy safety net |
| `N8nWebhookService` | `app/Services/N8nWebhookService.php` | Fires webhooks to n8n |
| `api-client.ts` | `services/api-client.ts` | Single Axios instance — all frontend API calls |
| `useAvailableSlots` | `features/bookings/hooks/` | TanStack Query hook for slot fetching |
| `BookingCalendar` | `components/calendar/booking-calendar.tsx` | FullCalendar wrapper — main dashboard component |
