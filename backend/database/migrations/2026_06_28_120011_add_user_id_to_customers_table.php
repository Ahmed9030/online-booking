<?php

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignUuid('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Customer::whereNull('user_id')->chunkById(100, function ($customers) {
            foreach ($customers as $customer) {
                $user = User::where('phone', $customer->phone)
                    ->where('role', 'customer')
                    ->first();

                if ($user !== null) {
                    $customer->user()->associate($user);
                    $customer->saveQuietly();
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
