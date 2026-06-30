<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement("DO $$ BEGIN
                CREATE TYPE booking_status AS ENUM ('confirmed', 'completed', 'no_show', 'cancelled');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;");
            DB::statement("DO $$ BEGIN
                CREATE TYPE booking_source AS ENUM ('online', 'manual');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;");
        }

        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignUuid('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->rawColumn('status', 'booking_status')->index();
            $table->rawColumn('source', 'booking_source')->nullable();
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['staff_id', 'starts_at', 'ends_at']);
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                CREATE INDEX bookings_staff_time_idx
                ON bookings (staff_id, starts_at, ends_at)
                WHERE status = 'confirmed'
            SQL
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('DROP TYPE IF EXISTS booking_source');
            DB::statement('DROP TYPE IF EXISTS booking_status');
        }
    }
};
