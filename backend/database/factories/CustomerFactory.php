<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition()
    {
        return [
            'business_id' => null,
            'phone' => $this->faker->e164PhoneNumber,
            'name' => $this->faker->name,
            'otp_verified_at' => now(),
            'visit_count' => 0,
            'last_visit_at' => null,
        ];
    }
}
