<?php

namespace Database\Factories;

use App\Models\StaffWorkingHour;
use Illuminate\Database\Eloquent\Factories\Factory;

class StaffWorkingHourFactory extends Factory
{
    protected $model = StaffWorkingHour::class;

    public function definition()
    {
        return [
            'staff_id' => null,
            'weekday' => 1,
            'start_time' => '09:00',
            'end_time' => '18:00',
        ];
    }
}
