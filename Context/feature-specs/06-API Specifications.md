# API Specifications — Barbershop Online Booking System (Updated)

This document outlines the API endpoints and the required Laravel architectural layers (Form Requests, Resources, Policies, and Tests) for the MVP.

---

## 1. API Endpoints Overview
*(Refer to the previous section for the full list of endpoints: Auth, Public, Owner, Staff, Customer, Admin, Internal)*

---

## 2. Form Request Classes
*Used for validating incoming request data.*

| Class Name | Associated Endpoint(s) | Key Validations |
| :--- | :--- | :--- |
| `RegisterOwnerRequest` | `POST /auth/register` | Business name, owner email (unique), password (confirmed). |
| `LoginRequest` | `POST /auth/login` | Email/Username, Password. |
| `SendOtpRequest` | `POST /auth/otp/send` | Phone number (Egyptian/GCC format). |
| `CreateBookingRequest` | `POST /public/bookings` | `service_id`, `staff_id` (nullable), `starts_at` (future date). |
| `StoreBranchRequest` | `POST /owner/branches` | Name, Address, WhatsApp number. |
| `StoreStaffRequest` | `POST /owner/staff` | Name, `branch_id`, `user_id` (optional). |
| `SetWorkingHoursRequest` | `PUT /owner/staff/{id}/hours` | Day of week (0-6), Start/End times. |
| `StoreServiceRequest` | `POST /owner/services` | Name, Duration (minutes), Price. |

---

## 3. API Resource Classes
*Used for transforming models into consistent JSON responses.*

| Class Name | Model | Key Fields |
| :--- | :--- | :--- |
| `BusinessResource` | `Business` | `id`, `name`, `slug`, `logo_url`, `subscription_status`. |
| `BranchResource` | `Branch` | `id`, `name`, `address`, `whatsapp_number`, `is_active`. |
| `StaffResource` | `Staff` | `id`, `name`, `photo_url`, `is_active`, `working_hours`. |
| `ServiceResource` | `Service` | `id`, `name`, `duration_minutes`, `price`. |
| `BookingResource` | `Booking` | `id`, `customer`, `service`, `staff`, `starts_at`, `status`. |
| `CustomerResource` | `Customer` | `id`, `name`, `phone`, `visit_count`, `last_visit_at`. |

---

## 4. Policy Classes
*Used for authorizing actions based on user roles and business ownership.*

| Policy Name | Protected Actions | Logic Summary |
| :--- | :--- | :--- |
| `BusinessPolicy` | `view`, `update` | Only the owner can view/update their own business profile. |
| `BranchPolicy` | `view`, `update`, `delete` | Actions must be scoped to the owner's `business_id`. |
| `StaffPolicy` | `view`, `update`, `manageHours` | Owner manages all; Staff can only `view` their own profile. |
| `ServicePolicy` | `create`, `update`, `delete` | Only the owner of the business can manage services. |
| `BookingPolicy` | `view`, `updateStatus`, `cancel` | Owner: all; Staff: only their own; Customer: only their own. |

---

## 5. Authorization & Functional Tests
*Critical tests to ensure security and business logic integrity.*

### Required Test Case: `StaffCannotAccessOtherStaffScheduleTest`
*   **Objective:** Verify that a user with the `staff` role cannot view or modify the appointment schedule of another staff member.
*   **Logic:**
    1. Create two staff members (A and B) under the same business.
    2. Authenticate as Staff A.
    3. Attempt to `GET /api/v1/staff/schedule` (should only return A's schedule).
    4. Attempt to `GET /api/v1/bookings/{id_of_staff_B}`.
    5. **Expected Result:** API should return `403 Forbidden` for any resource belonging to Staff B.

### Other Recommended Tests:
*   `OwnerCannotAccessOtherBusinessDataTest`: Ensure multi-tenancy isolation.
*   `ExpiredSubscriptionPreventsBookingTest`: Ensure `EnsureSubscriptionActive` middleware works.
*   `CustomerCannotCancelPastBookingTest`: Business logic validation.

---

## 6. Implementation Checklist
- [ ] Generate all **Form Request** classes using `php artisan make:request`.
- [ ] Generate all **API Resource** classes using `php artisan make:resource`.
- [ ] Generate all **Policy** classes using `php artisan make:policy`.
- [ ] Implement the `StaffCannotAccessOtherStaffScheduleTest` in `tests/Feature/Authorization/`.
- [ ] Register all Policies in `AuthServiceProvider`.
