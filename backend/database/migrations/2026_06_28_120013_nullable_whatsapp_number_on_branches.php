<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->string('whatsapp_number')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('branches')->whereNull('whatsapp_number')->update(['whatsapp_number' => '']);

        Schema::table('branches', function (Blueprint $table) {
            $table->string('whatsapp_number')->nullable(false)->change();
        });
    }
};
