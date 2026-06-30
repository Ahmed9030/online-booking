<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TYPE user_role ADD VALUE 'customer'");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TYPE user_role RENAME TO user_role_old');
            DB::statement("CREATE TYPE user_role AS ENUM ('owner', 'staff', 'admin')");
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE user_role USING (CASE WHEN role::text = 'customer' THEN 'staff'::user_role ELSE role::text::user_role END)");
            DB::statement('DROP TYPE user_role_old');
        }
    }
};
