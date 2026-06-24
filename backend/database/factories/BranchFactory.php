<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

class BranchFactory extends Factory
{
    protected $model = Branch::class;

    public function definition()
    {
        return [
            'business_id' => null,
            'name' => $this->faker->company . ' Branch',
            'address' => $this->faker->address,
            'city' => $this->faker->city,
            'whatsapp_number' => $this->faker->phoneNumber,
            'slug' => $this->faker->slug,
            'is_active' => true,
        ];
    }
}
