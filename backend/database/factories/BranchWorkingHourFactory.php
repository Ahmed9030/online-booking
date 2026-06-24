<?php

namespace Database\Factories;

use App\Models\BranchWorkingHour;
use Illuminate\Database\Eloquent\Factories\Factory;

class BranchWorkingHourFactory extends Factory
{
    protected $model = BranchWorkingHour::class;

    public function definition()
    {
        return [
            'branch_id' => null,
            'weekday' => 1,
            'open_time' => '09:00',
            'close_time' => '18:00',
        ];
    }
}
