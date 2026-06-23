# Code Standards
# Booking SaaS — Barbershop Appointment Platform

> These standards apply to ALL code generated or modified during this project.
> AI must follow these without exception unless a deviation is explicitly approved
> and noted in the session.

---

## General Principles

1. **Clarity over cleverness** — write code a tired solo founder can debug at midnight.
2. **No premature optimization** — optimize when profiling shows a real problem, not before.
3. **Explicit over implicit** — name things what they are, never abbreviate ambiguously.
4. **One thing per file** — one component, one action, one hook per file.
5. **Fail loudly in development, gracefully in production** — use assertions and early throws in dev.

---

## Naming Conventions

### General
| Type | Convention | Example |
|---|---|---|
| Variables | camelCase | `bookingStartsAt` |
| Constants | SCREAMING_SNAKE | `MAX_OTP_ATTEMPTS` |
| Functions/methods | camelCase | `getAvailableSlots()` |
| Classes | PascalCase | `CreateBookingAction` |
| Files (TS/JS) | kebab-case | `booking-calendar.tsx` |
| Files (PHP) | PascalCase | `CreateBookingAction.php` |
| DB tables | snake_case plural | `branch_working_hours` |
| DB columns | snake_case | `starts_at`, `business_id` |
| API routes | kebab-case plural | `/api/v1/staff-working-hours` |
| React components | PascalCase | `TimeSlotPicker` |
| CSS classes | kebab-case | `neu-card`, `booking-calendar` |
| Zod schemas | camelCase + Schema suffix | `createBookingSchema` |
| Laravel Form Requests | PascalCase + Request suffix | `StoreBookingRequest` |
| Laravel Events | PastTense PascalCase | `BookingCreated` |
| Laravel Jobs | PresentContinuous PascalCase | `SendBookingConfirmationWebhook` |

---

## TypeScript Standards (Frontend)

### Strict Mode
```json
// tsconfig.json — always enforce
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  }
}
```

### Types vs Interfaces
- Use `interface` for object shapes that describe domain entities (models).
- Use `type` for unions, utility types, and function signatures.

```ts
// ✅ Correct — domain entity = interface
interface Booking {
  id: string
  status: BookingStatus
  startsAt: string   // ISO string from API
  endsAt: string
  customer: Customer
  staff: Staff | null
  service: Service
}

// ✅ Correct — union = type
type BookingStatus = 'confirmed' | 'completed' | 'no_show' | 'cancelled'

// ✅ Correct — function sig = type
type GetAvailableSlotsParams = {
  branchId: string
  serviceId: string
  staffId?: string
  date: string
}
```

### API Response Typing
All API responses are wrapped in a standard envelope:
```ts
interface ApiResponse<T> {
  data: T
  message?: string
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
```

### Never use `any`
```ts
// ❌ Never
const handleResponse = (data: any) => {}

// ✅ Use unknown and narrow, or define a proper type
const handleResponse = (data: unknown) => {
  if (isBooking(data)) { ... }
}
```

### Async Functions
Always use `async/await`, never `.then().catch()` chains.
Always wrap in try/catch at the call site or use a wrapper utility.

```ts
// ✅ Correct
const createBooking = async (payload: CreateBookingPayload): Promise<Booking> => {
  try {
    const response = await apiClient.post<ApiResponse<Booking>>('/public/bookings', payload)
    return response.data.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}
```

### React Component Patterns

Always use function components with named exports:
```tsx
// ✅ Correct
interface TimeSlotPickerProps {
  slots: TimeSlot[]
  selectedSlot: string | null
  onSelect: (slotId: string) => void
}

export function TimeSlotPicker({ slots, selectedSlot, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((slot) => (
        <button
          key={slot.id}
          className={cn(
            'neu-slot',
            selectedSlot === slot.id && 'neu-slot--selected'
          )}
          onClick={() => onSelect(slot.id)}
        >
          {slot.label}
        </button>
      ))}
    </div>
  )
}
```

### Always use `cn()` for conditional classes
```tsx
import { cn } from '@/lib/utils'

// ✅ Correct
<div className={cn('neu-card', isActive && 'neu-card--active', className)} />

// ❌ Never use string interpolation for conditional classes
<div className={`neu-card ${isActive ? 'neu-card--active' : ''}`} />
```

### TanStack Query hooks — always in `features/[domain]/hooks/`
```ts
// features/bookings/hooks/use-available-slots.ts
export function useAvailableSlots(params: GetAvailableSlotsParams) {
  return useQuery({
    queryKey: ['available-slots', params],
    queryFn: () => bookingsApi.getAvailableSlots(params),
    enabled: !!params.branchId && !!params.serviceId && !!params.date,
    staleTime: 30_000,   // 30 seconds — slots change, don't cache long
  })
}
```

### Forms — always React Hook Form + Zod
```tsx
// ✅ Correct pattern
const schema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  phone: z.string().regex(/^(\+20|0)?1[0-2,5]\d{8}$/, 'رقم الهاتف غير صحيح'),
})

type FormValues = z.infer<typeof schema>

export function CustomerInfoForm({ onSubmit }: { onSubmit: (v: FormValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  ...
}
```

---

## PHP / Laravel Standards (Backend)

### PHP Version
PHP 8.3+ only. Use typed properties, enums, readonly properties, and named args freely.

### Strict Types
Every PHP file must start with:
```php
<?php

declare(strict_types=1);
```

### Enums
Always use native PHP 8.1+ backed enums for status fields:
```php
// ✅ Correct
enum BookingStatus: string
{
    case Confirmed = 'confirmed';
    case Completed = 'completed';
    case NoShow    = 'no_show';
    case Cancelled = 'cancelled';
}

enum UserRole: string
{
    case Owner  = 'owner';
    case Staff  = 'staff';
    case Admin  = 'admin';
}
```

### Models
```php
// ✅ Correct model structure
class Booking extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'business_id', 'branch_id', 'customer_id',
        'service_id', 'staff_id',
        'starts_at', 'ends_at',
        'status', 'source', 'notes',
        'created_by_user_id',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
        'status'    => BookingStatus::class,
        'source'    => BookingSource::class,
    ];

    // Always define all relationships — never lazy-load by accident in controllers
    public function business(): BelongsTo { ... }
    public function branch(): BelongsTo { ... }
    public function customer(): BelongsTo { ... }
    public function staff(): BelongsTo { ... }
    public function service(): BelongsTo { ... }
}
```

### Actions — single public `handle()` method
```php
// ✅ Correct
final class CreateBookingAction
{
    public function __construct(
        private readonly AvailabilityService $availability,
    ) {}

    public function handle(CreateBookingData $data): Booking
    {
        return DB::transaction(function () use ($data) {
            $this->availability->assertSlotAvailable(
                $data->staffId,
                $data->startsAt,
                $data->endsAt,
            );

            $booking = Booking::create([...]);

            event(new BookingCreated($booking));

            return $booking;
        });
    }
}
```

### Controllers — thin, delegate to Actions
```php
// ✅ Correct — controller does: validate → call action → return resource
public function store(StoreBookingRequest $request, CreateBookingAction $action): BookingResource
{
    $booking = $action->handle(
        CreateBookingData::fromRequest($request)
    );

    return new BookingResource($booking);
}

// ❌ Never put business logic in a controller
```

### Services — use for complex cross-entity logic only
```php
// AvailabilityService is the primary service — it answers:
// "what slots are available for staff X performing service Y on date Z?"
// "is slot (starts, ends) free for staff X?"

final class AvailabilityService
{
    public function getAvailableSlots(
        Branch $branch,
        Service $service,
        ?Staff $staff,
        Carbon $date,
    ): Collection { ... }

    public function assertSlotAvailable(
        string $staffId,
        Carbon $startsAt,
        Carbon $endsAt,
    ): void {
        // Throws SlotNotAvailableException if conflict exists
        // Always called inside a DB transaction for safety
    }
}
```

### API Resources
Always use resources, never return Eloquent models directly:
```php
// ✅ Correct
return new BookingResource($booking);
return BookingResource::collection($bookings);

// Always include only what the client needs — no over-fetching
class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'startsAt'  => $this->starts_at->toIso8601String(),
            'endsAt'    => $this->ends_at->toIso8601String(),
            'status'    => $this->status->value,
            'source'    => $this->source->value,
            'service'   => new ServiceResource($this->whenLoaded('service')),
            'staff'     => new StaffResource($this->whenLoaded('staff')),
            'customer'  => new CustomerResource($this->whenLoaded('customer')),
        ];
    }
}
```

### Responses — always consistent envelope
```php
// Success
return response()->json([
    'data'    => new BookingResource($booking),
    'message' => __('booking.created'),
], 201);

// Error (use Laravel's built-in exception handler where possible)
return response()->json([
    'message' => __('availability.slot_taken'),
], 422);
```

### Form Requests — always validate here, not in controllers/actions
```php
class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public endpoint — auth is OTP-based separately
    }

    public function rules(): array
    {
        return [
            'branch_id'  => ['required', 'uuid', 'exists:branches,id'],
            'service_id' => ['required', 'uuid', 'exists:services,id'],
            'staff_id'   => ['nullable', 'uuid', 'exists:staff,id'],
            'starts_at'  => ['required', 'date', 'after:now'],
        ];
    }

    public function messages(): array
    {
        return [
            'starts_at.after' => __('validation.booking.past_time'),
        ];
    }
}
```

### Route Organization
```php
// routes/api/v1/owner.php
Route::middleware(['auth:sanctum', 'role:owner', 'subscription.active'])
    ->prefix('owner')
    ->group(function () {
        Route::apiResource('branches', BranchController::class);
        Route::apiResource('staff', StaffController::class);
        Route::apiResource('services', ServiceController::class);
    });
```

---

## Database Standards

- Always use **UUID primary keys** (`HasUuids` trait or `uuid()` migration method).
- Always use **timestamps** (`created_at`, `updated_at`) on every table.
- Use **soft deletes** (`deleted_at`) on: `bookings`, `staff`, `services`, `branches`.
- Column names: `snake_case`, always explicit (never single-letter like `s` or `t`).
- Foreign keys: `{table_singular}_id` pattern (e.g., `business_id`, `branch_id`).
- All date/time columns: stored in **UTC**. Convert to `Africa/Cairo` (UTC+3) in the frontend only.
- Migration naming: `YYYY_MM_DD_HHMMSS_create_{table}_table.php`.
- Every migration must have a `down()` method that cleanly reverses the change.

---

## API Standards

- All responses wrapped in `{ data: ... }` (or `{ data: [], meta: {} }` for paginated).
- Errors always return `{ message: string, errors?: Record<string, string[]> }`.
- HTTP status codes used correctly:
  - `200` OK
  - `201` Created
  - `204` No Content (delete success)
  - `401` Unauthenticated
  - `403` Unauthorized (auth'd but no permission)
  - `404` Not Found
  - `422` Validation failed
  - `429` Rate limited
- Always version the API from day one: `/api/v1/...`
- Never expose internal IDs or DB structure in error messages.

---

## Localization Standards

### Arabic-First Rules
- ALL user-facing strings must go through the i18n system — never hardcode Arabic
  or English strings in JSX or PHP blade/responses.
- In Next.js: use `useTranslations()` from `next-intl`.
- In Laravel: use `__('key')` with resources in `lang/ar/` files.
- Zod validation messages: always in Arabic for customer-facing forms,
  English acceptable for owner/admin dashboard forms (for MVP).

### Key naming
```json
// ar.json — flat dot-notation structure
{
  "booking.select_service":     "اختر الخدمة",
  "booking.select_barber":      "اختر الحلاق",
  "booking.any_available":      "أي حلاق متاح",
  "booking.confirm_title":      "تأكيد الحجز",
  "booking.otp_sent":           "تم إرسال رمز التحقق على واتساب",
  "status.confirmed":           "مؤكد",
  "status.completed":           "مكتمل",
  "status.no_show":             "لم يحضر",
  "status.cancelled":           "ملغي"
}
```

---

## Git Standards

### Branch naming
```
main              → production-ready only
dev               → integration branch
feature/{name}    → new feature (e.g. feature/booking-conflict-check)
fix/{name}        → bug fix (e.g. fix/otp-expiry)
chore/{name}      → non-functional (e.g. chore/update-deps)
```

### Commit messages (Conventional Commits)
```
feat: add AvailabilityService slot generation
fix: prevent double-booking race condition
chore: add BookingResource with staff/service eager loading
test: add AvailabilityConflictTest for concurrent bookings
refactor: extract AssignAvailableStaffAction from CreateBookingAction
```

### Rules
- Never commit directly to `main`.
- Never commit `.env` files.
- Always commit `composer.lock` and `package-lock.json`.
- Write commit messages in English even if UI is in Arabic.

---

## Error Handling Standards

### Frontend
```ts
// Always normalize API errors into a consistent shape
export function normalizeApiError(error: unknown): AppError {
  if (isAxiosError(error)) {
    return {
      message: error.response?.data?.message ?? 'حدث خطأ غير متوقع',
      errors: error.response?.data?.errors,
      status: error.response?.status,
    }
  }
  return { message: 'حدث خطأ غير متوقع' }
}
```

### Backend
- Use custom exception classes for domain errors (e.g., `SlotNotAvailableException`,
  `OtpExpiredException`).
- Register them in `bootstrap/app.php` with appropriate HTTP response mapping.
- Never leak stack traces or DB query details to API responses in production.

---

## Testing Standards

### Backend (Laravel)
- Feature tests for all API endpoints (happy path + key failure cases).
- **Mandatory feature tests:**
  - `AvailabilityConflictTest` — two simultaneous bookings, only one succeeds.
  - `AnyAvailableStaffAssignmentTest` — correct staff assigned.
  - `StaffCannotAccessOtherStaffScheduleTest` — authorization boundary.
  - `OtpLoginTest` — OTP creation, verify, expiry.
- Unit tests for `AvailabilityService` (pure logic, no DB).
- Use `RefreshDatabase` trait in tests.
- Use factories for all test data — never insert raw DB rows.

### Frontend
- Component tests for the public booking flow steps (critical user path).
- No need for comprehensive test coverage in MVP — focus on the booking flow and auth.

---

## Security Checklist (Always Verify)

- [ ] `BusinessScope` applied to all tenant models — no cross-tenant data leaks.
- [ ] `EnsureUserHasRole` middleware on all role-protected routes.
- [ ] `VerifyInternalWebhookSecret` on all `/internal/*` routes.
- [ ] OTP codes expire after 5 minutes; single-use (mark `consumed_at`).
- [ ] Rate limit OTP requests per phone number (max 3 per 10 minutes).
- [ ] Booking slot conflict check inside a DB transaction with row lock.
- [ ] No raw SQL — use Eloquent query builder only.
- [ ] Validate `business_id` ownership in every policy — don't trust client-sent IDs alone.
- [ ] API keys / secrets in `.env` only — never in code or version control.
