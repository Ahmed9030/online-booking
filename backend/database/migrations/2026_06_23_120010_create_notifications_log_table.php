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
                CREATE TYPE notification_type AS ENUM ('confirmation', 'reminder', 'cancellation');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;");
            DB::statement("DO $$ BEGIN
                CREATE TYPE notification_channel AS ENUM ('whatsapp', 'sms', 'email');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;");
            DB::statement("DO $$ BEGIN
                CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;");
        }

        Schema::create('notifications_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->rawColumn('type', 'notification_type');
            $table->rawColumn('channel', 'notification_channel');
            $table->rawColumn('status', 'notification_status')->index();
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications_log');

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('DROP TYPE IF EXISTS notification_status');
            DB::statement('DROP TYPE IF EXISTS notification_channel');
            DB::statement('DROP TYPE IF EXISTS notification_type');
        }
    }
};
