Summary by CodeRabbit

New Features

Added admin dashboards for analytics, businesses, subscriptions, and users.
Introduced staff and owner management screens for bookings, branches, services, customers, settings, and working hours.
Added a richer public landing page, booking flow improvements, and localized calendar/date/time selectors.
Bug Fixes

Improved locale-aware navigation, redirects, and route protection.
Enhanced booking and staff validation to prevent invalid service assignments and booking actions.
Refined status displays, loading states, and session handling for a smoother experience.
-------------------------


 -- What will u fix :
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/auth/hooks/useLogin.ts` around lines 44 - 52, The
post-login redirect in useLogin currently points to locale-less routes, which
can send users out of their active language tree. Update the redirect logic
around the routes map and router.push call to preserve the current locale
segment when building the target path, using the existing locale-aware routing
context in useLogin so each role redirects to the same route under the active
locale.

-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Owner/StaffController.php` around lines
162 - 173, The staff credential update flow in StaffController currently forces
username validation even when the staff member already has a user account, so
their existing username gets rejected by the unique rule. Update the validation
and User::updateOrCreate logic to preserve the current username for existing
accounts (using the staff’s current user_id/user record in the unique check),
while still allowing password-only resets through the existing updateOrCreate
path. Reference the validate() call and the updateOrCreate() block in
StaffController to keep the fix localized.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/12-Landing` Page.md around lines 757 - 761, The final
CTA link path is mismatched with the actual register route, and the button label
may not match the implemented translation pattern. Update the landing page CTA
in the Link/Button block to use the correct registration route symbol and align
the Arabic copy with the real localization usage, verifying the href and the
text composition around t('landing.free') so it matches the intended
implementation.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/12-Landing` Page.md around lines 164 - 172, The landing
page call-to-action link path is mismatched with the actual route; update the
Link in the hero section to use the real register route instead of the spec-only
path. Locate the Link/Button block in the landing page content and change the
href to match the app’s existing routing pattern used by the register page so
navigation works correctly.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/12-Landing` Page.md around lines 483 - 487, The
customer CTA route is inconsistent between the spec and the implementation, so
update the landing page spec to match the actual booking entry point used by the
CTA. In the section containing the Link/Button for “احجز الآن مجاناً”, replace
the outdated /ar/book path with the real customer flow route /ar/find-business
so the spec aligns with the route used by the booking entry point.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/12-Landing` Page.md around lines 282 - 286, The owner
CTA link is pointing to the wrong registration route and may also advertise an
inaccurate trial length. Update the Link in the landing page CTA to use the
actual Arabic registration path handled by the auth flow (the Register CTA
block), and verify the button text “ابدأ الآن - مجاني لمدة 14 يوم” matches the
current free-trial business rule before keeping it or adjusting the copy.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/12-Landing` Page.md around lines 158 - 162, The landing
page spec currently shows the wrong booking CTA route; update the example in the
feature spec to match the actual implementation used by the hero button in the
landing page, which routes to the booking flow via router.push with the
/ar/find-business path. Keep the surrounding copy and button label intact, and
make sure the spec references the same route symbol used by the live page so the
documented behavior matches the implemented CTA.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/11-Admin` Dashboard .md around lines 345 - 360, The
technology stack section in the admin dashboard spec contains incorrect version
claims, so update the version entries in the Backend and Frontend lists to match
the actual project and currently supported releases. Adjust the Laravel entry in
the spec to the real version used by the codebase, and change the Next.js entry
to the version reflected in the repository (as seen in package.json and related
project files). Keep the rest of the stack list unchanged and ensure the spec
wording is consistent and accurate for implementers.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/12-Landing` Page.md around lines 99 - 103, The landing
page spec uses the wrong login route path. Update the `<Link href=...>` in the
landing page spec to match the actual route structure used by the home page
implementation in `page.tsx`, specifically the `/ar/login` path instead of
`/ar/auth/login`. Keep the surrounding `auth.login` button reference unchanged
and ensure the documented route matches the locale-aware public login route used
by the app.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(public)/find-business/page.tsx around lines 68 -
72, The `handleBook` navigation in `find-business/page.tsx` is manually
prefixing the locale, which can conflict with the i18n router’s own locale
handling. Update `router.push` in `handleBook` to use the unprefixed internal
booking path like the other public booking pages, and rely on the `useRouter`
helper from `@/i18n/routing` to apply the locale automatically.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(public)/page.tsx around lines 57 - 61, The CTA
links in the public landing page are hardcoded to the Arabic locale, so update
the navigation in the relevant Link targets to preserve the active [locale]
segment instead of always using /ar. Use the locale-aware routing approach
already used elsewhere in the public booking flow, or derive the prefix from the
current locale and apply it consistently in the affected CTA blocks such as the
login and booking buttons. Ensure the same fix is applied across all matching
Link usages in this page component.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(public)/page.tsx around lines 83 - 145, The
landing page copy is still mostly hardcoded in mixed Arabic/English instead of
being driven by next-intl, so the `[locale]` route will not render properly
localized content. Move the remaining hero, tabs, features, pricing, FAQ, CTA,
and footer strings in `page.tsx` into translation keys and replace the hardcoded
text with `t(...)` lookups, using the existing localization pattern already
present in the page component.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In
`@frontend/src/app/`[locale]/(public)/book/[businessSlug]/[branchSlug]/time-select/page.tsx
around lines 43 - 45, The booking reset effect in time-select/page.tsx only
clears selectedSlot, leaving the store step out of sync after selectSlot() has
moved it to step 4. Update the reset logic to use a dedicated useBookingStore
action that clears both selectedSlot and step together, and replace the direct
setState call inside the useEffect so the booking flow and otp/page.tsx remain
consistent.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/bookings/[id]/page.tsx at
line 24, The booking detail page is using useBookingDetail(id), which currently
targets the owner booking endpoint and will 403 for staff users on this route.
Update the booking detail loading in the page component to be role-aware by
selecting the staff detail endpoint when the current user is staff, or otherwise
prevent staff from reaching this page if no staff-specific detail endpoint
exists. Use the page’s existing booking fetch call and the related status action
flow as the place to wire in the role-based selection.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/layout.tsx around lines 11 - 15, The
route guard in isOwnerOnlyPath is matching against locale-stripped paths without
removing the /dashboard base segment, so owner-only checks can be bypassed for
routes like /ar/dashboard/services. Update isOwnerOnlyPath in the dashboard
layout to normalize the pathname by stripping both the locale prefix and the
/dashboard subpath before comparing against ownerOnlyPaths, and make the same
adjustment anywhere else in this layout that reuses the path check so the
owner-only route list matches consistently.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/calendar/page.tsx around
lines 29 - 32, The calendar page is hardcoded to Arabic/RTL instead of
respecting the active locale. Update the locale-scoped dashboard page and its
related calendar/modal/sidebar sections to derive copy, date/time formatting,
and layout direction from the current locale rather than fixed Arabic values.
Replace the hardcoded locale="ar" and direction="rtl" usage with values driven
by the route locale, and ensure helpers like formatTime and all referenced UI
strings/components follow the active locale consistently.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/branches/[id]/page.tsx
around lines 22 - 28, Make BranchEditFormData and the branch edit flow treat
whatsapp_number as optional, since the API can now return null. Update the
branch form schema/validation and the reset logic in the Branch edit page so the
field is not required and any null value from the API is converted to an empty
string before hydrating the input. Check the BranchEditFormData type and the
form setup/reset code in the page component to keep them consistent with the
backend.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/bookings/create/page.tsx
around lines 126 - 160, Scope the blocked-slot lookup in the bookings create
flow so it does not rely on the first 200 generic results. Update the useQuery
in the bookings create page to request the selected day range from
/owner/bookings (and keep branch/staff filters), or otherwise fetch all pages
before computing availability, then let blockedSlots continue deriving from
existingBookings in useMemo.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/bookings/create/page.tsx
around lines 289 - 295, The DatePicker `minDate` handling in `create/page.tsx`
is using UTC via `new Date().toISOString().split('T')[0]`, which can shift the
date ahead in negative time zones and block valid same-day bookings. Update the
`DatePicker` usages for both start and end date (the `startDate` and `endDate`
fields) to derive the minimum date from local time instead of UTC, keeping the
change localized to the booking form component and its date helper logic if you
extract one.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/calendar/page.tsx around
lines 140 - 150, The “live” sidebar is using a stale timestamp because
CurrentSessionCard (and the matching next-booking logic in the same dashboard
calendar page) memoizes new Date() once, so the booking lookup never advances
after mount. Update the time source to refresh periodically, such as by storing
“now” in state with an interval or using a live clock hook, and have the
current/next booking calculations recompute from that updating value instead of
a one-time useMemo snapshot. Ensure both the “الجاري الآن” and “الحجز القادم”
cards use the same live time source so they stay in sync.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/components/forms/BookingForm.tsx` around lines 101 - 106, The
fallback end-time calculation in BookingForm is doing manual HH:mm math and can
produce invalid datetimes like 24:15 instead of rolling over to the next day.
Update the logic around starts_at/ends_at in BookingForm to use Date-based
arithmetic, matching the confirm flow’s approach, so the computed end timestamp
is always valid even when the service duration crosses midnight. Keep the
slot-provided values unchanged, but replace the inline duration fallback with a
Date-driven computation that derives ends_at from the start datetime plus
service duration.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/admin/businesses/[id]/page.tsx around lines 39 -
40, The subscription editor state in the business page is initialized empty and
never synced from the loaded business, so the form stays blank after the query
resolves. Update the state in the `BusinessPage` component by seeding
`selectedStatus` and `expiresAt` from the fetched business/subscription data
inside the same effect or data-loading flow that populates the page, and make
sure the form inputs use those values once the query completes so editing expiry
without reselecting status works.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/components/dashboard/StaffModal.tsx` around lines 36 - 37, The
branch dropdown in StaffModal only uses the first page from useBranchesList(),
so branches beyond the backend default page size are missing. Update StaffModal
to either request enough branches up front or handle pagination/infinite loading
when building the branch options, using the paginated response from
useBranchesList() and the Branches hook contract. Make sure the dropdown is
populated from all available branches, not just branchesData.data on the initial
page.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/staff/[id]/page.tsx around
lines 211 - 215, The Assign Services save button in the staff detail page is
incorrectly disabled when selectedServiceIds is empty, which blocks clearing all
services for a staff member. Update the Button in the staff/[id]/page.tsx view
so it only disables while assignServices.isPending, and keep
handleAssignServices submitting the current selectedServiceIds array as-is,
since useStaff’s assign mutation already accepts an empty service_ids payload.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(dashboard)/dashboard/staff/page.tsx around lines
17 - 18, The staff management page is only rendering the first paginated result
because useStaffList() is called without any pagination inputs and the UI only
maps staffData.data. Update the page component to request and handle pagination
explicitly (using the PaginatedResponse<Staff> contract from useStaffList), and
make the list rendering in the staff page consume the current page’s
data/controls so additional staff can be reached instead of being hidden.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/globals.css` around lines 307 - 414, The landing-page
animation utilities in globals.css add continuous motion without a
reduced-motion fallback, so update the animation classes and keyframes to
respect users who opt out of motion. Add a prefers-reduced-motion media query
near the animate-fade-in-up, animate-float, animate-float-delayed,
animate-bounce-slow, animate-scale-in, and animate-slide-in-left rules to
disable or neutralize these animations when reduced motion is requested, while
keeping the existing behavior for other users.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/bookings/hooks/useDashboardBookings.ts` around lines 51
- 58, The shared booking detail hook is hard-coding the owner-specific endpoint,
which breaks staff usage; update `useBookingDetail` in `useDashboardBookings` so
it does not always call `/owner/bookings/${id}`. Make the hook role-aware like
the rest of the module by routing through the appropriate booking-detail
endpoint based on the current user role/context, or split owner-only detail
fetching into an owner-specific hook so staff screens do not invoke an
unavailable route.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/bookings/hooks/useDashboardBookings.ts` around lines 22
- 43, The bookings query in useDashboardBookings currently reuses the same
queryKey for both /staff/bookings and /owner/bookings, so cached data can leak
across roles after auth changes. Update the query key generation in
useDashboardBookings (and any helper around getBookingsEndpoint if needed) to
include the resolved endpoint or the current role from useAuthStore so staff and
owner bookings are cached separately. Keep the queryFn unchanged, but ensure the
key uniquely identifies the endpoint being fetched.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/services/api.ts` around lines 32 - 45, The 401 interceptor in
api.ts is excluding the wrong OTP paths, so auth errors from the OTP flows can
still hit the global logout/redirect logic. Update the authEndpoints list and
the isAuthEndpoint check in the api.interceptors.response handler to match the
actual routes used by useVerifyOtp and related auth calls (for example, the
/auth/otp/* endpoints) so OTP login/verify errors are handled by the form
instead of the session-clearing path.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/components/layout/TopBar.tsx` around lines 34 - 39, The
icon-only logout button in TopBar should have an explicit accessible name
because `title` is not sufficient for assistive tech. Update the logout button
in `TopBar` to include `aria-label={t('auth.logout')}` alongside the existing
`onClick`, `disabled`, and `title` props so the control is announced correctly.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/components/dashboard/WorkingHoursEditor.tsx` around lines 40 -
55, The `useEffect` in `WorkingHoursEditor` only updates `hours` and `dayOff`
when `initialHours.length > 0`, so stale schedule state can remain when the
editor is reused with no hours. Update the effect to always rebuild local state
from `initialHours ?? []`, clearing both `hours` and `dayOff` when the input is
empty, and keep the logic centered around the existing `setHours` and
`setDayOff` state setters.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(auth)/register/page.tsx around lines 51 - 65, The
register page is still hard-coded for RTL/Arabic, so update the locale-aware
rendering in the register page component to match the login page’s handling. Use
the current locale to set the container direction and arrow orientation instead
of forcing dir="rtl", and move all fixed placeholders, option labels, and city
names behind translations in the register form. Update the literals used by the
page’s Link/back icon and the form fields/select options so English and other
locales render correctly.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Resources/BusinessResource.php` around lines 25 - 27, The
subscription days remaining calculation in BusinessResource is using diffInDays
in the wrong direction, which flips the sign for future vs past expiries. Update
the subscription_days_remaining logic to call diffInDays from now() against
$this->subscription_expires_at, keeping the max(0, ...) guard, so the result in
BusinessResource matches the intended “days remaining” meaning.

---------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Staff/DashboardController.php` around
lines 25 - 33, The monthly booking metrics in DashboardController::index are
only filtered by month, so they can include records from prior years. Update the
Booking queries used for $monthBookings and $noShowCount to also constrain by
the current year, either by adding a year filter alongside whereMonth or by
switching both queries to a current-month date range, so month_bookings and
no_show_rate stay scoped correctly.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Staff/ScheduleController.php` around
lines 117 - 119, The ScheduleController cancel flow is letting
CancelBookingAction::handle() exceptions escape as 500s when a booking is
already completed or cancelled. Update the controller method that calls
$this->cancelBooking->handle($booking->id) to catch that business-rule conflict
and return a 4xx JSON response instead, using the existing BookingResource
response path only on success. Use the CancelBookingAction and the controller
action handling the cancellation to locate the fix.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Staff/ScheduleController.php` around
lines 37 - 52, The schedule filter inputs are being used directly in
ScheduleController::index and related actions without validation, so malformed
date and pagination values can still reach Carbon::parse() or pagination logic.
Add request validation for date_from, date_to, status, and per_page before any
parsing or query building, and make sure invalid values return a 422 rather than
falling through to the query; update the same pattern anywhere else in
ScheduleController that accepts these filter params.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Admin/AnalyticsController.php` around
lines 52 - 66, The month aggregation in AnalyticsController::monthlyRevenue is
hard-coded to PostgreSQL via DATE_TRUNC, so it will break on MySQL/SQLite
connections. Update the grouping logic to be driver-aware inside the analytics
query path (around Booking::withoutGlobalScopes()->select(...)->groupBy(...)),
either by branching on the active DB driver or by using a portable month
expression, and keep the Carbon formatting step aligned with the selected
grouping output.
-------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Owner/StaffController.php` around lines
120 - 128, Wrap the schedule replacement logic in StaffController’s staff update
flow in a database transaction so the delete-and-recreate sequence is atomic. In
the method that deletes existing records via workingHours()->delete() and then
creates StaffWorkingHour entries, begin a transaction before the delete, perform
all inserts, and commit only after every create succeeds; rollback on any
failure so the staff schedule is never left empty or partially updated.
-------------------------
