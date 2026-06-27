<?php

namespace Database\Factories;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition()
    {
        return [
            'business_id' => Business::factory(),
            'branch_id' => fn (array $attrs) => Branch::factory()->create(['business_id' => $attrs['business_id']])->id,
            'customer_id' => fn (array $attrs) => Customer::factory()->create(['business_id' => $attrs['business_id']])->id,
            'service_id' => fn (array $attrs) => Service::factory()->create([
                'business_id' => $attrs['business_id'],
                'branch_id' => $attrs['branch_id'],
            ])->id,
            'staff_id' => null,
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addDay()->addHour(),
            'status' => BookingStatus::Confirmed,
            'source' => BookingSource::Online,
            'created_by_user_id' => null,
            'notes' => null,
        ];
    }
}
