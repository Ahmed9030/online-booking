Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

Inline comments:
In `@backend/app/Http/Controllers/Api/V1/Owner/BranchController.php`:
- Around line 25-32: The per-page handling in BranchController is only clamping
the upper bound, so `index()` and `bookings()` can pass `0` or negative values
into `paginate()`. Update the `per_page` normalization in both methods to
enforce a minimum safe value as well as the existing maximum, using the existing
`index` and `bookings` flow around the `paginate()` calls so invalid client
input cannot reach pagination.

In `@backend/app/Http/Controllers/Api/V1/Staff/ScheduleController.php`:
- Around line 39-55: In `ScheduleController::index()`, the current date range
logic incorrectly parses `date_to` even when it is not provided, causing an
unintended upper bound. Update the query building so `date_from` and `date_to`
are handled independently, matching the behavior in `listBookings()`: apply the
lower bound when `date_from` exists, and add the `starts_at <= ...` constraint
only when `date_to` is present. Keep the default “today” filter only for the
no-date case.

In `@backend/app/Http/Controllers/Api/V1/Telegram/WebhookController.php`:
- Around line 30-35: Update the Telegram webhook auth check in
WebhookController::handle so it fails closed when the configured secret is
missing and uses a timing-safe comparison. Replace the current $secret && $token
!== $secret logic with a guard that rejects requests unless the secret token is
present, then compare the X-Telegram-Bot-Api-Secret-Token header cast to string
against the configured secret using hash_equals(). Ensure the unauthorized
response is returned whenever the secret is absent or the tokens do not match.

In
`@backend/database/migrations/2026_07_06_000001_add_endpoint_to_push_subscriptions.php`:
- Around line 14-17: The new endpoint column on push_subscriptions is only
indexed, so NotificationController::subscribe() can still race and create
duplicate rows when updateOrCreate runs concurrently. Update the migration to
add a database-level unique constraint for the user_id + endpoint pair (or the
appropriate dedup key used by subscribe()), and keep the existing index only if
it is still needed separately. Make sure the schema change matches the lookup in
NotificationController::subscribe() so the dedup is enforced atomically.
- Around line 15-16: The new endpoint field in the push subscriptions migration
is defined with the default string length, which may be too small for real-world
web push URLs. Update the migration in the anonymous Schema::table change so the
endpoint column uses a larger capacity suitable for push endpoints, and keep the
existing index on endpoint; use the add_endpoint_to_push_subscriptions migration
and the endpoint column definition as the place to make the change.

In `@Context/fix` iusses/03-notifcation iusses.md:
- Around line 122-129: The inline file path is split across backticks, which
breaks rendering and makes the path hard to read. Update the referenced path so
the full `@frontend/src/app/[locale]/(dashboard)/dashboard/calendar/page.tsx`
string is kept inside a single backticked token in the diff/comment text. Locate
the malformed path in the calendar page note and keep it as one continuous
inline code span.
- Around line 286-293: Update this checklist item to reference the real
migration that adds the endpoint column, since the endpoint-based dedup work is
already handled in the current push subscription flow. Point the note at
2026_07_06_000001_add_endpoint_to_push_subscriptions.php (or mark it resolved)
and ensure the controller reference stays aligned with
NotificationController::subscribe(), which already uses subscription->endpoint
as the unique key.

In `@Context/progress-tracker.md`:
- Around line 409-410: The Session Log table row is malformed because the
`progress-tracker.md` entry is missing the third column and closing pipe. Update
the row in the Session Log table so it consistently has three cells, using a
files-touched value or `—`, and keep the formatting aligned with the surrounding
entries in `progress-tracker.md`.

In `@frontend/src/components/ui/NeumorphicTimePicker.tsx`:
- Around line 28-33: The roundStep helper in NeumorphicTimePicker is clamping
overflowed minutes to 0, which can silently move the committed time backward
when commitTime uses that minute state directly. Update roundStep so that when
rounding produces 60 or higher, it returns the last valid minute slot for the
current step instead of zero, while keeping the existing lower-bound handling
and preserving the behavior for allowed minuteStep values.

---

Outside diff comments:
In
`@backend/app/Http/Controllers/Api/V1/Notifications/NotificationController.php`:
- Around line 66-78: The PushSubscription upsert in NotificationController is
not persisting the new endpoint column, so the indexed field stays NULL even
though the subscription JSON is saved. Update the updateOrCreate payload in the
notification handling method to write the extracted $endpoint into the dedicated
endpoint attribute alongside subscription, user_agent, and is_active, and keep
using the existing endpoint value from $validated['subscription']['endpoint'] so
the column stays in sync with the JSON blob.

In `@backend/app/Http/Controllers/Api/V1/Staff/ScheduleController.php`:
- Around line 66-80: The ScheduleController::show method parses the route date
directly with Carbon::parse(), so a malformed date can throw an uncaught
exception and become a 500. Add validation/parsing guard before using $date in
show, and return a proper 4xx response for invalid input; keep the existing
booking lookup logic unchanged once the date is valid.

In `@backend/app/Services/AvailabilityService.php`:
- Around line 144-179: Remove the redundant per-staff service membership query
inside AvailabilityService::getAvailableSlots (the loop over $qualifiedStaff).
Since the staff list already comes from $service->staff()->where('branch_id',
$branch->id), drop the services()->where('service_id', $service->id)->exists()
check and iterate directly over the qualified staff to avoid unnecessary
queries.

---

Nitpick comments:
In `@backend/app/Listeners/SendBookingConfirmationNotification.php`:
- Around line 9-11: Add queue failure handling to
SendBookingConfirmationNotification, which already implements ShouldQueue.
Update the listener to use InteractsWithQueue and define explicit retry settings
like $tries and $backoff, then add a failed() method so permanently failed
notification deliveries from sendBookingConfirmation are surfaced and can be
handled or logged. Use the existing SendBookingConfirmationNotification class
and its queueable notification flow as the place to wire this in.

In `@backend/app/Models/TelegramUser.php`:
- Around line 65-68: The Guzzle client configuration is duplicated and a new
Client is created on every sendMessage call, so extract the shared
timeout/connect_timeout setup into a reusable factory or container-bound
singleton and use it from both TelegramBotService::__construct and
TelegramUser::sendMessage. Update TelegramUser to reuse the shared client
instance instead of instantiating Client directly, so the configuration stays in
one place and the client is not rebuilt repeatedly.

In `@backend/app/Repositories/AvailabilityRepository.php`:
- Around line 28-42: The new AvailabilityRepository method
getConfirmedBookingsForStaffArray should match the sibling
getConfirmedBookingsForStaffOnDate style by using the imported Collection alias
instead of spelling out \Illuminate\Support\Collection inline. Update both the
docblock return annotation and the method return type in
getConfirmedBookingsForStaffArray so the repository uses a consistent Collection
type reference throughout.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/calendar/page.tsx:
- Around line 43-46: The locale resolution logic is duplicated between
CalendarPage and BookingModal, so extract the shared `(params.locale as string)
|| localeHook || 'ar'` fallback into a small reusable hook such as
useResolvedLocale(). Update CalendarPage and BookingModal to call that hook
instead of inlining the same expression, keeping the behavior identical while
centralizing locale handling.
- Line 346: The calendar sidebar still has hardcoded Arabic labels, so update
the remaining static strings in the dashboard calendar page to use the existing
translation flow instead of literal text. Replace the labels in the sidebar
section of the page component with the appropriate `t()` keys alongside the
other localized strings already used for the modal/header logic, including the
entries currently rendered as `مراقبة الصالون الحية`, `الجاري الآن`, and `الحجز
القادم`. Keep the changes within the calendar page’s sidebar rendering so all
visible labels are locale-aware and consistent.

In `@frontend/src/features/notifications/hooks/useNotifications.ts`:
- Line 5: The imported Notification type in useNotifications conflicts with the
global DOM Notification interface, so rename the domain type consistently across
the shared types and update this hook’s import to the new name. Follow the same
pattern used for AppPushSubscription in types/index.ts, and update any
references to the renamed type in useNotifications and related notification code
so the app-specific type is unambiguous.