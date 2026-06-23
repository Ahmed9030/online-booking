<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run demo seeder only in local environment
        if (! app()->environment('local')) {
        return;
    }
    
    if ($this->command?->confirm('Seed demo data?', false) ?? false) {
            $this->call(\Database\Seeders\DemoBusinessSeeder::class);
        }
    }
}
