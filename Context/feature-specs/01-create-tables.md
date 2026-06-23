Create Laravel 13 PostgreSQL migrations for the Booking SaaS Barbershop platform.

Requirements:

* PHP 8.3+
* PostgreSQL
* UUID primary keys for all entities
* Use Laravel HasUuids compatible schema
* All timestamps included
* Soft deletes ONLY on:

  * branches
  * staff
  * services
  * bookings

Tables to create in dependency order:

1. users

* id UUID PK
* business_id UUID nullable FK
* role ENUM(owner,staff,admin)
* name string
* email string nullable unique
* username string nullable unique
* password string
* phone string nullable
* is_active boolean default true
* last_login_at timestamp nullable
* timestamps

Indexes:

* business_id
* role
* unique(email)
* unique(username)

2. businesses

* id UUID PK
* owner_user_id UUID nullable FK
* name string
* logo_url string nullable
* description text nullable
* slug string unique
* subscription_status ENUM(trial,active,expired,suspended)
* subscription_expires_at timestamp nullable
* timestamps

Indexes:

* unique(slug)
* subscription_status

3. branches

* id UUID PK
* business_id UUID FK
* name string
* address text
* city string
* whatsapp_number string
* slug string
* is_active boolean default true
* timestamps
* softDeletes()

Indexes:

* business_id
* unique(business_id, slug)

4. branch_working_hours

* id UUID PK
* branch_id UUID FK
* weekday smallInteger
* open_time time nullable
* close_time time nullable
* timestamps

Indexes:

* branch_id
* unique(branch_id, weekday)

5. staff

* id UUID PK
* business_id UUID FK
* branch_id UUID FK
* user_id UUID nullable FK
* name string
* photo_url string nullable
* is_active boolean default true
* timestamps
* softDeletes()

Indexes:

* business_id
* branch_id
* user_id

6. staff_working_hours

* id UUID PK
* staff_id UUID FK
* weekday smallInteger
* start_time time nullable
* end_time time nullable
* timestamps

Indexes:

* staff_id
* unique(staff_id, weekday)

7. services

* id UUID PK
* business_id UUID FK
* branch_id UUID FK
* name string
* duration_minutes integer
* price decimal(10,2)
* is_active boolean default true
* timestamps
* softDeletes()

Indexes:

* business_id
* branch_id

8. staff_services

* staff_id UUID FK
* service_id UUID FK

Composite Primary Key:

* staff_id
* service_id

9. customers

* id UUID PK
* business_id UUID FK
* phone string
* name string
* otp_verified_at timestamp nullable
* visit_count integer default 0
* last_visit_at timestamp nullable
* timestamps

Indexes:

* business_id
* unique(business_id, phone)

10. otp_codes

* id UUID PK
* phone string
* code string(6)
* expires_at timestamp
* consumed_at timestamp nullable
* created_at timestamp

Indexes:

* phone
* expires_at

11. bookings

* id UUID PK
* business_id UUID FK
* branch_id UUID FK
* customer_id UUID FK
* service_id UUID FK
* staff_id UUID nullable FK
* starts_at timestamp
* ends_at timestamp
* status ENUM(confirmed,completed,no_show,cancelled)
* source ENUM(online,manual)
* created_by_user_id UUID nullable FK
* notes text nullable
* timestamps
* softDeletes()

Indexes:

* business_id
* branch_id
* staff_id
* customer_id
* status
* composite(staff_id, starts_at, ends_at)

Create PostgreSQL partial index:

CREATE INDEX bookings_staff_time_idx
ON bookings (staff_id, starts_at, ends_at)
WHERE status = 'confirmed';

12. notifications_log

* id UUID PK
* booking_id UUID FK
* type ENUM(confirmation,reminder,cancellation)
* channel ENUM(whatsapp,sms,email)
* status ENUM(queued,sent,failed)
* sent_at timestamp nullable
* error_message text nullable
* created_at timestamp

Indexes:

* booking_id
* status

Additional requirements:

* Use foreign key constraints everywhere.
* Use cascadeOnDelete only where appropriate.
* Follow Laravel 13 migration best practices.
* Use PostgreSQL native enum support where possible.
* Generate migrations only, no models, no seeders, no controllers.
* Ensure migration order prevents circular foreign key issues.
* Include proper down() methods for every migration.
