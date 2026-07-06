Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

Inline comments:
In `@backend/app/Jobs/SendDailySummary.php`:
- Around line 27-28: The daily summary date range in SendDailySummary is
collapsing because endOfDay() mutates the same Carbon instance used for the
start bound. Update the logic around the $today and $todayEnd variables so the
start remains at the beginning of the day and the end is computed from a
separate instance before passing both into whereBetween in SendDailySummary.

---

Major comments:
In `@backend/app/Events/BookingConfirmed.php`:
- Around line 11-19: The booking confirmation event is never being dispatched,
so the listener wired in EventServiceProvider cannot run. Update the booking
flow in CreateBookingAction to fire BookingConfirmed at the actual confirmation
point, or alternatively change the listener mapping to subscribe to
BookingCreated if that is the intended trigger. Use the BookingConfirmed event
class and the CreateBookingAction flow to locate the dispatch point and keep the
event/listener pair aligned.

In
`@backend/app/Http/Controllers/Api/V1/Notifications/NotificationController.php`:
- Around line 56-78: The subscribe() method in NotificationController is
matching PushSubscription records by the full subscription JSON, which can
create duplicate rows for the same device. Update the updateOrCreate lookup to
use the stable subscription endpoint (subscription->endpoint) together with
user_id, and keep the full subscription payload in the values being updated so
NotificationService only sees one active subscription per device.

In `@backend/app/Http/Controllers/Api/V1/Owner/BranchController.php`:
- Around line 24-29: The BranchController::index method is hardcoding
paginate(15), so the per_page request parameter from useBranchesList is ignored.
Update the index action to accept Illuminate\Http\Request, read per_page from
the request, and pass that value into paginate instead of a fixed 15 so
StaffModal can fetch all branches when needed.

In `@backend/app/Http/Controllers/Api/V1/Telegram/WebhookController.php`:
- Around line 28-42: The Telegram webhook handler currently accepts any POST and
logs the entire update payload on failures, so add a secret-token check in
handle() before calling TelegramService::handleUpdate(), comparing
X-Telegram-Bot-Api-Secret-Token to the configured value and rejecting mismatches
with an unauthorized response. Also update the exception logging in
Telegram/WebhookController::handle() to avoid dumping the full $update; log only
a minimal identifier such as update_id along with the error message.

In `@backend/app/Jobs/SendAppointmentReminders.php`:
- Around line 26-32: The date range in SendAppointmentReminders is collapsing
because endOfDay() mutates the same Carbon instance used for the lower bound.
Update the reminder query setup by keeping $tomorrow as the start-of-day value
and using a copied instance for $tomorrowEnd, then pass those two distinct
bounds into Booking::whereBetween() so the range covers the full day instead of
a single timestamp.

In `@backend/app/Jobs/SendDailySummary.php`:
- Around line 33-40: The revenue calculation in SendDailySummary::handle is
triggering an N+1 because each booking’s service is loaded lazily through
$b->service->price. Update the Booking query to eager-load the service
relationship with with('service') before calling get(), so the later
completedBookings/revenue aggregation uses the preloaded relation without
per-booking queries.
- Around line 42-51: The top-staff payload built in SendDailySummary::handle
only includes id and bookings, but TelegramBotService::sendDailySummary renders
each entry using name. Update the topStaff mapping so each item also carries the
staff member’s name (from the grouped booking data or a related staff lookup)
before it is passed through NotificationService::sendDailySummary, and keep the
existing bookings count and ordering logic intact.

In `@backend/app/Listeners/SendBookingConfirmationNotification.php`:
- Around line 10-40: The SendBookingConfirmationNotification listener is doing
blocking external I/O inside handle() via
NotificationService::sendBookingConfirmation, so it should be made queueable.
Update the SendBookingConfirmationNotification class to implement ShouldQueue
(and add any needed queue-related imports/config) so the notification and
downstream WebPush/Telegram calls run asynchronously like the existing queued
jobs. Keep the handle(BookingConfirmed $event) logic the same, but let the
framework dispatch it through the queue instead of the request cycle.

In `@backend/app/Models/TelegramUser.php`:
- Around line 65-77: The Telegram request in the TelegramUser sendMessage flow
has no timeout, so a slow Telegram API can block the caller indefinitely. Update
the Http client usage in the method that builds $client and calls post() to
include both a reasonable timeout and connect_timeout in the request options,
while keeping the existing payload merge logic intact. Use the sendMessage path
around the Client::post call and TelegramUser as the place to apply the fix.

In `@backend/app/Services/NotificationService.php`:
- Around line 143-165: The subscription data in
NotificationService::sendPushNotification is still a JSON string because
DB::table() bypasses PushSubscription casts, so the current
json_decode(json_encode(...), true) path is ineffective. Update the logic in the
foreach over $subscriptions to decode $sub->subscription directly with
json_decode($sub->subscription, true), and if the WebPush client expects a
subscription object/array shape, construct it in the format required before
calling sendNotification().

In `@backend/app/Services/TelegramBotService.php`:
- Around line 124-143: The HTML parse_mode messages in TelegramBotService are
interpolating unescaped user-controlled values directly into heredoc text, which
can break message sending or allow crafted HTML links. Update
sendBookingNotification, sendDailySummary, and the other related notification
method(s) in TelegramBotService to escape all dynamic fields
(customer/staff/service/time/price) before building the HTML message, then use
the escaped values in the heredoc passed to sendMessage.
- Around line 22-27: Add a request timeout to the Guzzle client created in
TelegramBotService::__construct(), since the current new Client uses the default
unlimited timeout and can block the webhook/notification flow. Update the client
initialization to pass a reasonable timeout option (and any related connect
timeout if appropriate) while keeping the existing bot token and apiUrl setup
unchanged.
- Around line 34-49: The Telegram webhook handling currently accepts any
anonymous POST and forwards the payload from WebhookController::handle() into
TelegramBotService::handleUpdate(), so add verification for the Telegram secret
token before processing updates. Update the webhook route/controller to require
and validate the X-Telegram-Bot-Api-Secret-Token header against the configured
secret, and reject requests that do not match. Keep the actual update processing
in TelegramBotService::handleUpdate() unchanged except for assuming the request
has already been authenticated.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/calendar/page.tsx:
- Around line 30-33: The time formatting helper is locale-aware now, but the
call sites in CurrentSessionCard and NextBookingCard still rely on the default
locale. Update the formatTime calls in those components to pass through the
active locale prop/value so the sidebar times match the page language instead of
always falling back to ar-EG. Use the existing formatTime function and the
locale argument threaded into CalendarPage/its child cards to keep all time
displays consistent.

In `@frontend/src/components/dashboard/WorkingHoursEditor.tsx`:
- Around line 40-57: WorkingHoursEditor is reinitializing local working-hours
state whenever initialHours changes identity, which can overwrite in-progress
edits after a refetch. Update the initialization logic in WorkingHoursEditor so
the useEffect runs only once per mounted record (or only when the selected staff
record actually changes), instead of depending directly on stableInitialHours,
and keep the current setHours/setDayOff setup from being rerun on every prop
refresh.

In `@frontend/src/components/forms/BookingForm.tsx`:
- Around line 102-108: The computed ends_at in BookingForm should derive the
date from the adjusted start Date instead of reusing data.date, since
start.setMinutes(...) may roll into the next day for bookings crossing midnight.
Update the fallback logic around starts_at/ends_at so the returned timestamp
uses the calendar date from the mutated start value and not the original input
date, keeping the value consistent for slots near midnight.

In `@frontend/src/components/ui/NeumorphicTimePicker.tsx`:
- Around line 93-109: The time picker options rendered in NeumorphicTimePicker
are not keyboard reachable because each hour/minute button uses tabIndex={-1},
and the dialog container lacks full modal accessibility behavior. Update the
option buttons in the item rendering logic so they can receive keyboard focus
and be navigated/selected, and ensure the panel opened by NeumorphicTimePicker
behaves as an accessible dialog by adding aria-modal="true" and moving focus
into the panel (for example to the first selectable time item) when it opens.
- Around line 28-30: The roundStep helper in NeumorphicTimePicker.tsx can
produce an invalid minute value of 60 when rounding near the next hour, which
breaks selection and display. Update roundStep (and any callers that use it for
minute state) to clamp or wrap the result so minutes always stay within 0..59,
and make sure the minute selection logic still maps to an existing item in the
minutes list.

In `@frontend/src/features/notifications/hooks/usePushNotifications.ts`:
- Around line 26-29: The push subscription in usePushNotifications uses
NEXT_PUBLIC_VAPID_PUBLIC_KEY directly as applicationServerKey, which needs a
binary key instead of a string. Update the subscription flow to decode the
base64url VAPID public key into a Uint8Array before calling
registration.pushManager.subscribe, and apply the change in the
usePushNotifications hook where the subscription is created.

In `@frontend/src/types/index.ts`:
- Around line 213-226: The Notification type is duplicated between the shared
types module and useNotifications, so the two definitions can drift apart.
Remove the local Notification interface from useNotifications and import the
shared Notification type from the types/index module instead, keeping
useNotifications and any related notification helpers aligned to a single source
of truth.

---

Minor comments:
In `@frontend/public/service-worker.js`:
- Around line 3-18: The push handler in self.addEventListener('push', ...)
should not force requireInteraction to true or assume payload data always
exists. Update the notification options construction so requireInteraction
respects an explicit false value from the parsed payload, and add a null check
before calling event.data.json() to safely handle push events without data. Use
the existing push event listener and notification options object to locate and
fix the logic.
- Around line 20-35: The notification click handler in
self.addEventListener('notificationclick') is hardcoded to focus or open '/',
but it should use a destination from the payload. Update the notification
payload to include action_url, then read that value from the event in this
handler and use it in both the clients.matchAll focus check and
clients.openWindow fallback instead of the root path.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/calendar/page.tsx:
- Around line 44-45: The booking modal in CalendarPage still hardcodes Arabic
text for the title, actions, and status labels, causing mixed-language UI in
non-Arabic locales. Update the modal rendering in the CalendarPage component to
use the existing common.* translation keys for the title and buttons/status
instead of literal Arabic strings, and keep the dir logic unchanged so
locale-specific text is sourced consistently from the i18n strings.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/staff/page.tsx:
- Around line 75-99: The pagination state in staff/page.tsx is not clamped when
staffData.meta.last_page decreases after a delete, so page can stay beyond the
valid range and render an empty grid. Update the staff page component to watch
page and staffData.meta.last_page and reset page to the new last_page when it
becomes too large, using the existing page state setter in the staff page logic;
also remember to import useEffect from react so the clamp runs whenever the
metadata changes.

In `@frontend/src/app/`[locale]/admin/businesses/[id]/page.tsx:
- Around line 42-52: The effect in the business details page is resetting local
form state whenever the fetched business object changes, which can overwrite
unsaved edits during background refetches. Update the useEffect in the page
component to initialize selectedStatus and expiresAt only when the business id
changes (or when first loading a different business), using the business
identifier rather than the full business object as the dependency. Keep the
local state controlled by the admin’s edits after initialization so refetches do
not clobber in-progress changes.

---

Nitpick comments:
In `@backend/app/Http/Controllers/Api/V1/Admin/AnalyticsController.php`:
- Around line 16-29: The monthExpr helper is currently a namespace-level
function in the Admin namespace instead of being part of AnalyticsController,
which can cause name collisions and makes it harder to test. Move monthExpr into
the AnalyticsController class as a method, then update the three existing call
sites to use $this->monthExpr(...). Keep the driver-specific logic unchanged,
but ensure the helper is only accessed through the controller instance.

In `@backend/app/Http/Controllers/Api/V1/Staff/ScheduleController.php`:
- Around line 41-49: The validation logic in ScheduleController is duplicated
with the same manual Validator::make(...)->fails()->throw ValidationException
pattern in index(), show(), and listBookings(). Replace each block with the
built-in request validation flow using $request->validate(...) or
Validator::make(...)->validate() so the rules are defined once and the
fail-and-throw behavior is handled automatically, keeping the validated data
returned directly from each method.

In `@backend/app/Services/AvailabilityService.php`:
- Around line 141-160: The getSlotsForAnyAvailableStaff method introduces an N+1
query pattern by calling getSlotsForSpecificStaff for every qualified staff
member, causing repeated working-hours and booking queries. Refactor this flow
to batch or eager-load the needed data for all staff upfront, then reuse it
inside getSlotsForAnyAvailableStaff and any helpers it depends on, while
preserving the current behavior of aggregating slots from all qualified staff.

In `@backend/app/Services/NotificationService.php`:
- Around line 148-170: The NotificationService::send push loop is recreating the
WebPush client and reapplying auth for every subscription, which is unnecessary
work. Hoist the new WebPush instance and the
addAuth(config('services.push.auth')) call out of the foreach over
$subscriptions so they are created once and reused for each sendNotification
call, while keeping the per-subscription payload/subscription decoding and error
handling inside the loop.
- Around line 83-93: The NotificationService currently resolves
TelegramBotService through the app() service locator in both
sendBookingAssignedToStaff and sendDailySummary, which makes the dependency
harder to test and less idiomatic. Update NotificationService to
constructor-inject TelegramBotService, store it on a class property, and replace
the app(TelegramBotService::class) calls with the injected instance in the
affected methods. Ensure any existing calls in sendBookingAssignedToStaff and
sendDailySummary use the shared dependency consistently.

In `@backend/config/services.php`:
- Around line 38-54: The push config in services.php duplicates the same VAPID
values in two shapes, which can drift over time. Update the nested auth.VAPID
settings to reuse the existing push.vapid_public_key and push.vapid_private_key
values instead of reading env() again, keeping a single source of truth while
preserving the library-friendly structure in the push block.

In
`@backend/database/migrations/2026_06_28_000001_create_notifications_table.php`:
- Around line 18-19: The `CreateNotificationsTable` migration defines a
redundant standalone index on `user_id` because the `['user_id', 'is_read']`
composite index already covers `user_id` lookups via leftmost-prefix behavior.
Remove the separate `->index()` from the `user_id` column definition in
`create_notifications_table`, and keep the composite index for query performance
and reduced write/storage overhead.

In
`@backend/database/migrations/2026_06_28_000002_create_push_subscriptions_table.php`:
- Around line 16-27: Store push subscriptions using the subscription endpoint as
the stable dedup key instead of the full JSON blob. Update the
push_subscriptions migration and any related persistence logic in
NotificationController::subscribe() so the table has a dedicated endpoint column
with a uniqueness constraint/index, and upserts use that endpoint rather than
the subscription payload; keep the rest of the subscription data only if needed
for metadata.

In `@backend/routes/console.php`:
- Around line 13-19: The scheduled jobs in console.php can overlap or run on
multiple servers, which may duplicate reminders/summaries. Update the
Schedule::job entries for SendAppointmentReminders and SendDailySummary to use
withoutOverlapping(), and add onOneServer() if this deployment can run on more
than one server, so the scheduled execution is serialized and single-instance.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/calendar/page.tsx:
- Line 20: The calendar page is manually deriving the active locale from
useParams in multiple places instead of using next-intl’s useLocale hook. Update
the calendar page component to import and use useLocale alongside
useTranslations, and replace the repeated params.locale fallback/casts with the
locale value returned by useLocale. Keep the existing locale-dependent logic in
the calendar page component, but centralize locale access so the duplicated
parsing in the locations around the current params usage is removed.
- Around line 247-248: The `CalendarPage` logic reuses the name `params` for
both the route params from `useParams()` and the local query params object
inside `staffScheduleQuery.queryFn`, which creates shadowing and hurts
readability. Rename one of these variables, preferably the inner `params` used
for the request payload, so the outer route params in `CalendarPage` remain
distinct and unambiguous. Keep the locale handling and query construction
unchanged aside from the identifier rename.

In `@frontend/src/app/`[locale]/(public)/page.tsx:
- Around line 5-8: The page is manually reading locale with useParams() and
prefixing every Link/router call itself, which should be replaced with the
locale-aware helpers from `@/i18n/routing`. Update the public page component to
use the shared Link and useRouter imports instead of next/link and
next/navigation, and remove the explicit locale interpolation in the affected
href and router.push usages so routing stays consistent with the other pages.
Use the existing symbols useParams, Link, and useRouter in this file to locate
and refactor all locale-dependent navigation.

In `@frontend/src/components/notifications/NotificationBell.tsx`:
- Around line 26-36: The NotificationBell toggle button has no accessible name
because it only renders the bell emoji. Update the button in NotificationBell so
it uses the same accessibility pattern as the logout button in TopBar.tsx by
adding a meaningful aria-label and title (for example, indicating it opens
notifications), while keeping the existing click behavior and unread badge
intact.
- Line 73: The timestamp formatting in NotificationBell is hardcoded to the
Arabic locale, so it ignores the user’s active language. Update the
NotificationBell component to read the current locale from next-intl via
useLocale(), then pass that locale into the created_at toLocaleString call
instead of 'ar-EG'. Keep the change localized to the notification date rendering
so it matches the locale-aware behavior used elsewhere in the app.

In `@frontend/src/features/notifications/hooks/useNotifications.ts`:
- Around line 9-22: The exported Notification interface in useNotifications.ts
conflicts with the browser’s global DOM Notification type, which can cause
ambiguity in the push-notification codepaths. Rename this local model to a
distinct symbol such as AppNotification or NotificationItem, then update any
imports/usages in the notification hooks and related components to reference the
new name consistently. Also check frontend/src/types/index.ts for any duplicate
notification model definitions and align them to the same non-conflicting type
name.

In `@frontend/src/types/index.ts`:
- Around line 228-234: Rename the exported domain type `PushSubscription` in
`frontend/src/types/index.ts` to avoid shadowing the browser’s built-in DOM
`PushSubscription` used by `usePushNotifications.ts`; update any imports/usages
in the codebase to the new symbol name so the domain model and the global
browser type can coexist without type conflicts.