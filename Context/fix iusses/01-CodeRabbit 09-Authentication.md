Summary by CodeRabbit

New Features

Added a full authentication flow with login, owner registration, OTP verification, logout, protected routes, and session persistence.
Added a public business finder and improved booking flow navigation, including booking, staff selection, and OTP steps.
Introduced public business listing and expanded dashboard/admin access controls.
Bug Fixes

Tightened booking and staff validation to prevent mismatched branch/service selections.
Improved customer booking history to include all linked customer records.
Documentation

Expanded API, request, resource, model, and frontend UI documentation across the app.


** Some comments are outside the diff and can’t be posted inline due to platform limitations.

---------------------------------
 Outside diff range comments (1)
Context/feature-specs/08-Frontend Foundation.md (1)
213-249: 🩺 Stability & Availability | 🔴 Critical | ⚡ Quick win

Keep the shared API client SSR-safe.

api is imported by the server-rendered booking page below, so localStorage and window.location.href will throw during SSR. Split the browser-only redirect/token handling out, or guard it before touching DOM APIs.

Prompt for AI Agents
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/08-Frontend` Foundation.md around lines 213 - 249, The
shared API client in api is not SSR-safe because the request/response
interceptors touch localStorage and window.location.href directly. Update the
api interceptors so browser-only behavior is guarded before accessing DOM APIs,
or move token storage and 401 redirect handling into a client-only layer used
outside server-rendered pages. Keep the axios instance itself safe to import
during SSR.


---------------------------------
-- Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/09-Authentication.md` around lines 1469 - 1474, The
token-storage checklist is misleading because it marks localStorage as a
security win without reflecting the cookie-backed auth flow used for route
protection. Update the Security checklist in Authentication to describe the
actual token handling in the auth flow and note the XSS tradeoff instead of
checking localStorage as completed; reference the “Security” checklist items and
the auth-cookie/Protected routes wording when rewriting it.

---------------------------------

Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/09-Authentication.md` around lines 782 - 786, The
post-OTP redirect is inconsistent with the spec flow: the bookingStep check in
useBookingStore.getState().step currently sends users to /ar/checkout, but OTP
completion should route to booking confirmation or /ar/my-bookings. Update the
router.push destination in this booking flow branch so it matches the documented
post-OTP route, and keep the condition around bookingStep === 4 intact while
adjusting the target path.

---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/09-Authentication.md` around lines 1236 - 1248, The
role-mismatch redirect in useEffect currently hardcodes a single fallback, which
can cause redirect loops and send different roles to the wrong place. Update the
guard that checks options.requiredRole and user.role to route unauthorized users
to a role-aware destination instead of always pushing /ar/dashboard; use the
existing role context/options to choose the correct fallback for staff,
customers, or other roles.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/store/auth.ts` around lines 59 - 65, The auth flow is persisting
the bearer token in web-accessible storage, which should be removed from the
client-side store logic. Update the auth handling in auth.ts, especially
setAuthCookie and the related token persistence paths, so the real API
credential is no longer written to localStorage or a JavaScript-created cookie;
instead, have the backend set and clear the session via an HttpOnly, Secure
cookie that client scripts cannot read or forge. Adjust the sign-in/sign-out and
token restore logic so they rely on the server-managed cookie rather than
browser storage.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/auth/hooks/useProtectedRoute.ts` around lines 30 - 40,
The unauthenticated redirect in useProtectedRoute is pointing to the wrong
localized login path and hardcoding Arabic. Update the router.push target used
when !token to use the real locale-based login route served by the login page,
and derive the locale from the current route or pathname instead of always using
/ar. Keep the role-guard redirect behavior in the same hook unchanged.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/auth/hooks/useLogin.ts` around lines 36 - 44, The
`useLogin` flow is writing `auth_token` directly to localStorage even though
`setToken` already persists it through `saveToStorage()`, causing inconsistent
token serialization. Update the `useLogin` logic to remove the redundant
`localStorage.setItem('auth_token', token)` and rely on `setToken(token)` so the
stored format matches `useAuthStore` and `loadFromStorage('auth_token')`
continues to work after refresh.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/auth/hooks/useRegister.ts` around lines 35 - 41, The
auth registration flow is persisting the token twice in different formats, which
breaks hydration. In useRegister, keep the setToken(token) call as the source of
truth for auth_token and remove the direct localStorage write of the raw token
so loadFromStorage() continues to read the store-managed JSON format correctly.
Leave the user and business persistence unchanged.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/auth/hooks/useOtp.ts` around lines 40 - 41, The OTP
role-switch flow in useOtp is leaving auth state inconsistent: setToken already
JSON-encodes the token, so make sure the login path only uses setToken and does
not write a raw auth_token value, and when switching to a customer session clear
any existing business data from the auth store. Update the role-handling logic
around useAuthStore, setUser, and setToken so the whole store is normalized for
the new session instead of carrying over stale owner/staff business state.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(auth)/login/page.tsx around lines 75 - 79, The
“remember me” checkbox in LoginPage is currently a no-op because its value is
never wired into useLogin, while the login flow still persists credentials
unconditionally. Either remove the checkbox from the form or register it in the
login state and pass the value through the login handler so useLogin can skip
persistence when it is unchecked. Keep the fix centered around the LoginPage
component and the useLogin hook.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(auth)/register/page.tsx at line 11, Step 1 of the
register flow can still submit the form when Enter is pressed because `onSubmit`
is left undefined. Update the `page.tsx` registration form logic so the step-1
path in the relevant form/component explicitly prevents Enter from triggering a
submit/reload, while still allowing validation to advance the flow; use the
existing register form/step handling around the step-1 submit behavior to apply
the fix consistently.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/auth/hooks/useAuthPersist.ts` around lines 25 - 34,
Hydration is writing auth data directly with useAuthStore.setState, which
bypasses the auth-store actions and can desync the auth_token cookie from store
state. Update useAuthPersist to hydrate via the existing auth-store action such
as setToken (and any related setters for user/business) instead of setState, and
make the catch path also clear the in-memory auth state through the auth store
so cookies, store, and localStorage stay aligned.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/services/api.ts` around lines 38 - 39, The 401 handling in
api.ts only clears the token via useAuthStore.getState().setToken(null), which
leaves stale user/business state behind. Update the error path in the API
interceptor to call the auth store’s logout() action instead, so the full
session is cleared consistently from memory, localStorage, and the auth cookie.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/08-Frontend` Foundation.md around lines 1428 - 1438,
The dashboard layout auth check currently only redirects when the token is
missing, so signed-in users without the owner role can still hit a blank screen.
Update the redirect logic in DashboardLayout to explicitly detect authenticated
non-owner sessions and send them to the appropriate route instead of returning
null, while keeping the existing missing-token login redirect behavior.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In
`@backend/database/migrations/2026_06_28_120013_nullable_whatsapp_number_on_branches.php`
around lines 16 - 20, The rollback in the migration’s down method for
nullable_whatsapp_number_on_branches currently restores branches.whatsapp_number
to NOT NULL without checking for existing NULL rows. Update the down path to
either backfill any NULL whatsapp_number values before calling change(), or
explicitly detect NULLs and abort with a clear exception in Schema::table so the
rollback cannot fail unexpectedly.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Actions/Bookings/CreateBookingAction.php` around lines 56 - 61,
The staff validation in CreateBookingAction currently only checks branch
membership, so also verify the selected Staff can perform the chosen service
before continuing. Update the staff lookup/validation block in
CreateBookingAction (around the Staff::findOrFail and branch_id check) to
confirm the staff is eligible for the requested service and reject the booking
if not, so invalid staff/service combinations cannot be persisted.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In
`@backend/database/migrations/2026_06_23_120011_add_customer_role_to_user_role_enum.php`
around lines 19 - 21, The rollback logic in the migration is remapping persisted
`customer` roles to `staff`, which can unintentionally grant elevated access.
Update the `ALTER TABLE users ALTER COLUMN role TYPE user_role USING (...)` step
in the migration so it does not silently convert `customer` values; instead,
make the rollback fail fast when `customer` rows are present and require those
records to be cleaned up explicitly before proceeding.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/10-Dashboard` Frontend.md around lines 820 - 821, The
dashboard is still hard-coding the Arabic locale in date formatting and likely
in related URL generation, which will break non-Arabic routes. Update the
relevant dashboard rendering and link-building logic to derive the active locale
from the route instead of assuming ar, and reuse that locale wherever the
dashboard formats dates or constructs navigation targets. Focus on the dashboard
components/helpers that use toLocaleString and any /ar/... link patterns so they
consistently follow the current locale.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/10-Dashboard` Frontend.md around lines 2148 - 2158, The
QueryClient default mutation settings currently enable a global retry in the
queryClient setup, which can replay non-idempotent Dashboard writes. Update the
mutations config in queryClient to disable retries by default, and only allow
retries explicitly on individual safe mutations that can tolerate replay. Keep
the existing query retry behavior unchanged.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In
`@frontend/src/app/`[locale]/(public)/book/[businessSlug]/[branchSlug]/otp/page.tsx
around lines 51 - 66, The OTP countdown in onSendOtp starts a new setInterval
each time without clearing any existing timer, so multiple timers can overlap
and keep running after navigation or resend. Update the otp/page.tsx flow around
onSendOtp and the countdown state to store the interval handle, clear any
previous interval before creating a new one, and ensure cleanup on unmount or
when the user leaves the verify step so only one timer affects setTimeRemaining.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In
`@frontend/src/app/`[locale]/(public)/book/[businessSlug]/[branchSlug]/otp/page.tsx
around lines 17 - 18, The post-OTP redirect logic in the otp page is hardcoding
the Arabic locale and ignoring the active [locale] route segment, which can send
non-Arabic users to the wrong language. Update the redirect paths in the OTP
flow to be locale-aware by deriving the current locale from useParams and
building locale-relative routes in the relevant navigation logic (including the
push/redirect handling around the OTP verification step), so the same flow works
for every locale.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/components/ui/Input.tsx` around lines 14 - 15, The validation
lookup in Input.tsx is double-scoping keys because useTranslations('validation')
already applies the validation namespace, so translatedError should not pass the
full error key unchanged. Update the translation logic in Input to either use
the root translator for error values or normalize the error string by removing
the validation. prefix before calling t, so keys referenced by translatedError
resolve correctly.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In
`@frontend/src/app/`[locale]/(public)/book/[businessSlug]/[branchSlug]/time-select/page.tsx
around lines 43 - 47, The redirect in the time-select page’s useEffect is firing
on mount because selectedSlot persists in the booking store, so users who come
back from OTP are immediately pushed forward again. Update the logic in the
time-select page component to redirect only after a new selection made on this
visit, or clear selectedSlot when this page is entered; use the existing
selectedSlot, businessSlug, branchSlug, router, and useEffect flow to gate the
push behavior.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(public)/find-business/page.tsx around lines 39 -
54, The handleBusinessChange branch lookup can race, allowing an older api.get
response to overwrite branches for a newer selected slug. Add stale-response
protection in handleBusinessChange by tracking the latest requested slug (or a
request id) and only calling setBranches when the response still matches the
current selection. Make sure the async flow around setSelectedBusiness, api.get,
setBranches, and setBranchesLoading ignores responses for previous slugs.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/components/forms/BookingForm.tsx` around lines 31 - 33, Reset
the booking store’s branch-dependent state whenever `BookingForm` hydrates a new
`branch`, because `useBookingStore.setState({ branch })` preserves `step`,
`service`, `staff`, and `selectedSlot`. Update the `useEffect` in `BookingForm`
to set `branch` together with a reset back to the initial booking state so the
flow always restarts at step 1 and clears stale selections; use the
`useBookingStore` store and its related booking state fields to locate the
change.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/09-Authentication.md` around lines 11 - 16, The Owner
entry in the authentication spec has the wrong login route, pointing to the
signup endpoint instead of the login page. Update the Owner row in the
authentication table so its Login Route uses the correct owner login path, and
verify the surrounding auth entries remain consistent with the route naming used
by the other roles.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/09-Authentication.md` around lines 1477 - 1484, The
manual test checklist in the Authentication spec uses non-localized routes, so
update the affected entries to use the same localized path prefix as the rest of
the document. Edit the checklist items around the redirect flows and
protected-route case so they reference the localized equivalents consistently,
keeping the existing behavior but matching the app’s route structure.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/features/auth/hooks/useLogout.ts` at line 6, The logout redirect
currently hardcodes the Arabic path, so users lose their active locale after
signing out. Update useLogout and its redirect logic to preserve the current
locale by using the locale-aware router or by reading the existing locale before
calling the navigation helper. Make sure the redirect path in the logout flow
(including the related logout handler block) uses the active locale instead of
always pushing /ar.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(customer)/layout.tsx around lines 7 - 19, The
CustomerLayout guard only checks for a token, so owner/staff/admin sessions can
still render customer pages. Update CustomerLayout to read the current user from
useAuthStore and require user?.role === 'customer' before allowing access; if
the role is missing or not customer, redirect to /login and return null just
like the existing unauthenticated path.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(auth)/login/page.tsx around lines 32 - 35, The
login page is hardcoded to RTL with Arabic placeholders instead of adapting to
the active locale. Update the login view in the page component so the wrapper
direction and all placeholder text are driven by the current locale (for example
via the locale-aware i18n data already used by this route), and apply the same
fix to the other affected inputs in the login form referenced by the same page
component.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/proxy.ts` around lines 40 - 42, The protected-path check in
proxy.ts is too broad because protectedPaths.some with startsWith on
pathWithoutLocale will also match unrelated routes like /administer. Update the
matching logic in the isProtectedPath calculation so it only returns true for an
exact protected route or a child segment of it, and keep the change localized to
the path matching used by the proxy middleware.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(auth)/register/page.tsx around lines 49 - 58, The
onSubmit handler is duplicating registration error handling because useRegister
already provides onError feedback, so remove the local try/catch around
register.mutateAsync in RegisterPage and let the mutation’s existing error path
handle the toast. If you need custom handling, keep it centralized in the
useRegister hook or its onError callback instead of calling showToast again from
onSubmit.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Customer/MyBookingsController.php` at
line 35, The Booking queries in MyBookingsController are using implicit static
calls that PHPStan flags as undefined, so make the query builder explicit.
Update each Booking::whereIn(...) chain in the affected actions to start with
Booking::query()->whereIn(...) while keeping the rest of the constraints and
behavior unchanged. Use the Booking model references in MyBookingsController to
find and update all three occurrences.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Owner/BookingController.php` around lines
59 - 62, The dependent exists rules in BookingController::validate are reading
branch_id from $request->input(), which can allow an invalid payload shape to
reach the query. Update the service_id and staff_id validation rules to use the
already validated branch_id from $validated['branch_id'] instead, keeping the
dependency tied to the sanitized value and preserving the existing Rule::exists
constraints.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Owner/StaffController.php` at line 143,
The service assignment validation in StaffController still scopes only by
business_id, so it can accept services from other branches. Update the
service_ids.* Rule::exists check to also constrain by $staff->branch_id in the
staff update/create flow, using the same validation block where service_ids is
validated. Make sure the branch-scoped constraint is applied alongside the
existing business_id filter so only services available to that staff member’s
branch can be assigned.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/10-Dashboard` Frontend.md around lines 806 - 812, The
status text in this booking details block should use the existing
BookingStatusBadge instead of the dynamic text-${selectedBooking.status} class,
since Tailwind may not generate runtime-computed classes. Update the JSX where
selectedBooking.status is rendered to reuse BookingStatusBadge’s literal
status-to-class mapping and keep the status label translation via
t(`status.${selectedBooking.status}`).
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@Context/feature-specs/10-Dashboard` Frontend.md around lines 127 - 190, The
booking mutation hooks currently only invalidate the list cache, so detail views
can remain stale after edits. Update useUpdateBookingStatus, useCreateBooking,
and useDeleteBooking to also invalidate the matching detail query key used by
booking pages, especially the singular booking key for the affected id where
available. Keep the existing list invalidation in place, and add the targeted
detail invalidation alongside it so both list and detail caches refresh after
mutations.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In
`@frontend/src/app/`[locale]/(public)/book/[businessSlug]/[branchSlug]/otp/page.tsx
around lines 93 - 96, The OTP page is hardcoding RTL, which breaks non-RTL
locales like English. Update the `otp/page.tsx` layout so the `dir` attribute is
derived from the active locale instead of always being `"rtl"`, using the locale
value available to the page/component and applying the appropriate direction for
each locale.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@frontend/src/app/`[locale]/(public)/find-business/page.tsx at line 73, The
FindBusiness page is hard-coding RTL direction on the root container, which
makes every locale render right-to-left. Update the direction handling in the
page component (or remove it here if the shared locale layout already sets it)
so the value comes from the active locale instead of a fixed rtl string. Use the
existing page/component structure in find-business/page.tsx to wire this through
consistently for both English and RTL locales.
---------------------------------
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@backend/app/Http/Controllers/Api/V1/Public/BranchController.php` around lines
9 - 28, The public business listing in BranchController::index currently loads
every non-suspended Business on each anonymous request, which will not scale
well. Update this endpoint to either paginate the query before passing it to
BusinessResource::collection or add short-lived caching around the
Business::where(...)->orderBy(...)->get() result so repeated requests are
cheaper. Keep the change localized to the index method and preserve the existing
response shape as much as possible.

---------------------------------
