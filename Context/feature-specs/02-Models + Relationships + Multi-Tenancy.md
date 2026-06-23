Scope
This document defines:
Eloquent Models structure
Relationships between entities
Multi-tenancy core (BusinessScope)
Authentication system (Laravel Sanctum)
Role model (owner / staff / admin / customer OTP flow)
1. 🧱 Domain Models Overview
Core Entities
Business (Tenant Root)
Branch
Staff
Service
Booking
Customer
User (Auth: owner/staff/admin)
OTP Code
Subscription (MVP: fields inside businesses)
2. 🧩 Models Specification
2.1 Business
class Business extends Model
{
    use HasUuids;

    protected $fillable = [
        'owner_user_id',
        'name',
        'logo_url',
        'description',
        'slug',
        'subscription_status',
        'subscription_expires_at',
    ];
}
Relationships
public function owner(): BelongsTo
public function branches(): HasMany
public function staff(): HasMany
public function services(): HasMany
public function customers(): HasMany
public function bookings(): HasMany
2.2 Branch
class Branch extends Model
{
    use HasUuids;
}
Relationships
public function business(): BelongsTo
public function staff(): HasMany
public function services(): HasMany
public function bookings(): HasMany
2.3 Staff
class Staff extends Model
{
    use HasUuids;
}
Relationships
public function business(): BelongsTo
public function branch(): BelongsTo
public function user(): HasOne

public function services(): BelongsToMany
public function bookings(): HasMany
2.4 Service
class Service extends Model
{
    use HasUuids;
}
Relationships
public function business(): BelongsTo
public function branch(): BelongsTo

public function staff(): BelongsToMany
public function bookings(): HasMany
2.5 Booking (Core Entity)
class Booking extends Model
{
    use HasUuids, SoftDeletes;
}
Relationships
public function business(): BelongsTo
public function branch(): BelongsTo
public function customer(): BelongsTo
public function staff(): BelongsTo
public function service(): BelongsTo
public function createdBy(): BelongsTo (User)
2.6 Customer
class Customer extends Model
{
    use HasUuids;
}
Relationships
public function business(): BelongsTo
public function bookings(): HasMany
2.7 User (Auth Entity)
class User extends Authenticatable
{
    use HasApiTokens, HasUuids;
}
Relationships
public function business(): BelongsTo
public function staff(): HasOne
public function ownedBusiness(): HasOne
2.8 OTP Code
class OtpCode extends Model
{
    use HasUuids;
}
No business scope.
3. 🏢 Multi-Tenancy Core (BusinessScope)
3.1 Concept
All tenant data is scoped by:
business_id
Applied automatically using a Global Scope.
3.2 BusinessScope Implementation
class BusinessScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
         $user = auth()->user();

        if ($user === null || $user->business_id === null || $user->role === UserRole::Admin) {
            return;
        

            $builder->where($model->getTable().'.business_id', $user->business_id);
        }
    }
}
3.3 Applied Models
Branch
Staff
Service
Booking
Customer
3.4 EXCLUDED Models (IMPORTANT)
These MUST NOT use BusinessScope:
User
Business
OTP Codes
Reason:
They define tenancy boundary, not scoped inside it.
3.5 Public Booking Flow Exception
For public routes:
business_id resolved from slug
NOT from auth()
Handled via:
Business::where('slug', $slug)->firstOrFail();
Then injected manually into queries.
3.6 Security Rule
Never trust:
request->business_id
Always derive from:
auth()->user()->business_id (dashboard)
slug resolution (public booking)
4. 🔐 Sanctum Authentication Architecture
4.1 Auth Strategy
Laravel Sanctum used for API tokens:
Token Types
Role	Token Name	Expiry
Owner	owner-token	30 days
Staff	staff-token	30 days
Customer	customer-token	24 hours
Admin	admin-token	30 days
4.2 Login Flows
Owner / Staff Login
POST /api/v1/auth/login
Flow:
Validate credentials
Create Sanctum token
Return user + token
Customer OTP Flow
Step 1: Send OTP
POST /api/v1/auth/otp/send
Step 2: Verify OTP
POST /api/v1/auth/otp/verify
On success:
Create or retrieve Customer
Issue Sanctum token
4.3 Middleware Guards
auth:sanctum
role:owner
role:staff
role:admin
4.4 Role System
enum UserRole: string
{
    case Owner = 'owner';
    case Staff = 'staff';
    case Admin = 'admin';
}
Stored in:
users.role
4.5 Authorization Rule (Critical)
Owner
Full access within business_id
Staff
Only:
own bookings
own schedule
Admin
Full platform access (no BusinessScope)
Customer
Only own bookings (phone-based identity)
5. 🔗 Key Relationship Rules
5.1 Booking Integrity Rule
A booking MUST always have:
business_id
branch_id
customer_id
service_id
staff_id (nullable initially)
5.2 Staff Assignment Rule
Staff belongs to:
- Business
- Branch (primary)
But can serve:
Multiple services (M2M)
5.3 Service Availability Rule
Service availability is defined by:
branch_working_hours
+ staff_working_hours
+ existing bookings (conflicts)
6. ⚙️ Important System Constraints
6.1 UUID Standard
All models:
use HasUuids;
6.2 Soft Deletes
Required:
bookings
staff
services
branches
6.3 Timezone Rule
DB: UTC only
Display: Africa/Cairo (frontend)
7. 🧠 Critical Architecture Rules
Rule 1 — No manual business_id filtering
Always rely on BusinessScope (except public flow).
Rule 2 — No cross-tenant leakage allowed
Any query without BusinessScope = BUG.
Rule 3 — OTP is identity for customers
No password system for customers.
Rule 4 — Sanctum is API-only
No session auth.
8. 🚀 Output Summary
This spec defines:
Clean multi-tenant Laravel architecture
Strict BusinessScope isolation
Sanctum-based auth system
Full relationship graph for all models
Safe booking + staff assignment foundation


