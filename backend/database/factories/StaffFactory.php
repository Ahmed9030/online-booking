<?php

namespace Database\Factories;

use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

class StaffFactory extends Factory
{
    protected $model = Staff::class;

    public function definition()
    {
        return [
            'business_id' => null,
            'branch_id' => null,
            'user_id' => null,
            'name' => $this->faker->name,
            'photo_url' => null,
            'is_active' => true,
        ];
    }
}
