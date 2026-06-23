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
        if ($this->command->confirm('Seed demo data?', true)) {
            $this->call(\Database\Seeders\DemoBusinessSeeder::class);
        }
    }
}
