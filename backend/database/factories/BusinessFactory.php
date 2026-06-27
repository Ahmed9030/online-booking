<?php

namespace Database\Factories;

use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition()
    {
        $name = $this->faker->company();

        return [
            'owner_user_id' => null,
            'name' => $name,
            'logo_url' => null,
            'description' => $this->faker->sentence(),
            'slug' => Str::slug($name).'-'.Str::random(4),
            'subscription_status' => 'active',
            'subscription_expires_at' => now()->addDays(30),
        ];
    }
}
