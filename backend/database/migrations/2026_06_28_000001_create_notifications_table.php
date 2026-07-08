<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to create the in-app notifications table.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->string('type'); // booking_confirmed, booking_reminder, etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Extra data (booking_id, customer_name, etc.)

            $table->string('icon')->nullable(); // emoji or icon name
            $table->string('action_url')->nullable(); // /ar/my-bookings/123

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
