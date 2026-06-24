<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition()
    {
        return [
            'business_id' => null,
            'branch_id' => null,
            'name' => $this->faker->word . ' Service',
            'duration_minutes' => 30,
            'price' => 100.00,
            'is_active' => true,
        ];
    }
}
