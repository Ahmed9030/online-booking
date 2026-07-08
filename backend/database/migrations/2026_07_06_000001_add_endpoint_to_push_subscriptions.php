<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->string('endpoint', 500)->nullable()->after('user_id');
            $table->index('endpoint');
            $table->unique(['user_id', 'endpoint']);
        });

        DB::statement("UPDATE push_subscriptions SET endpoint = subscription->>'endpoint' WHERE endpoint IS NULL");
    }

    public function down(): void
    {
        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'endpoint']);
            $table->dropIndex(['endpoint']);
            $table->dropColumn('endpoint');
        });
    }
};
