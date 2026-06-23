<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\BranchWorkingHour;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use App\Models\StaffWorkingHour;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoBusinessSeeder extends Seeder
{
    public function run(): void
    {

     if (! app()->environment('local')) {
        $this->command?->warn('DemoBusinessSeeder skipped outside local environment.');
        return;
    }

        $owner = User::firstOrCreate(
            ['email' => 'owner@demo.local'],
            [
                'name' => 'Demo Owner',
                'password' => Hash::make('password'),
                'role' => UserRole::Owner,
                'is_active' => true,
            ],
        );

        $business = Business::firstOrCreate(
            ['slug' => 'demo-barbershop'],
            [
                'owner_user_id' => $owner->id,
                'name' => 'Demo Barbershop',
                'description' => 'A demonstration barbershop for testing the booking system.',
                'subscription_status' => 'trial',
                'subscription_expires_at' => now()->addDays(30),
            ],
        );

        $owner->update(['business_id' => $business->id]);

        $branch1 = Branch::firstOrCreate(
            ['business_id' => $business->id, 'slug' => 'cairo-main'],
            [
                'name' => 'Cairo Main',
                'address' => '123 Zamalek Street, Cairo',
                'city' => 'Cairo',
                'whatsapp_number' => '+201001234567',
                'is_active' => true,
            ],
        );

        $branch2 = Branch::firstOrCreate(
            ['business_id' => $business->id, 'slug' => 'giza-branch'],
            [
                'name' => 'Giza Branch',
                'address' => '456 Haram Street, Giza',
                'city' => 'Giza',
                'whatsapp_number' => '+201001234568',
                'is_active' => true,
            ],
        );

        // Branch working hours
        for ($day = 0; $day < 7; $day++) {
            if ($day === 5) {
                BranchWorkingHour::firstOrCreate(
                    ['branch_id' => $branch1->id, 'weekday' => $day],
                    ['open_time' => null, 'close_time' => null],
                );
            } else {
                BranchWorkingHour::firstOrCreate(
                    ['branch_id' => $branch1->id, 'weekday' => $day],
                    ['open_time' => '09:00', 'close_time' => '18:00'],
                );
            }
        }

        for ($day = 0; $day < 7; $day++) {
            if ($day === 5) {
                BranchWorkingHour::firstOrCreate(
                    ['branch_id' => $branch2->id, 'weekday' => $day],
                    ['open_time' => null, 'close_time' => null],
                );
            } else {
                BranchWorkingHour::firstOrCreate(
                    ['branch_id' => $branch2->id, 'weekday' => $day],
                    ['open_time' => '10:00', 'close_time' => '19:00'],
                );
            }
        }

        $staffAhmed = Staff::firstOrCreate(
            ['business_id' => $business->id, 'name' => 'Ahmed'],
            [
                'branch_id' => $branch1->id,
                'user_id' => null,
                'is_active' => true,
            ],
        );

        $staffKarim = Staff::firstOrCreate(
            ['business_id' => $business->id, 'name' => 'Karim'],
            [
                'branch_id' => $branch1->id,
                'is_active' => true,
            ],
        );

        $staffHassan = Staff::firstOrCreate(
            ['business_id' => $business->id, 'name' => 'Hassan'],
            [
                'branch_id' => $branch2->id,
                'is_active' => true,
            ],
        );

        $staffOmar = Staff::firstOrCreate(
            ['business_id' => $business->id, 'name' => 'Omar'],
            [
                'branch_id' => $branch1->id,
                'is_active' => true,
            ],
        );

        foreach ([$staffAhmed, $staffKarim, $staffHassan, $staffOmar] as $staff) {
            for ($day = 0; $day < 7; $day++) {
                if ($day === 5) {
                    StaffWorkingHour::firstOrCreate(
                        ['staff_id' => $staff->id, 'weekday' => $day],
                        ['start_time' => null, 'end_time' => null],
                    );
                } else {
                    StaffWorkingHour::firstOrCreate(
                        ['staff_id' => $staff->id, 'weekday' => $day],
                        ['start_time' => '09:00', 'end_time' => '18:00'],
                    );
                }
            }
        }

        $serviceHaircut = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch1->id, 'name' => 'Haircut'],
            [
                'duration_minutes' => 30,
                'price' => 50.00,
                'is_active' => true,
            ],
        );

        $serviceBeardTrim = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch1->id, 'name' => 'Beard Trim'],
            [
                'duration_minutes' => 15,
                'price' => 20.00,
                'is_active' => true,
            ],
        );

        $serviceFullService = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch1->id, 'name' => 'Full Service'],
            [
                'duration_minutes' => 60,
                'price' => 100.00,
                'is_active' => true,
            ],
        );

        $serviceHaircut2 = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch2->id, 'name' => 'Haircut'],
            [
                'duration_minutes' => 30,
                'price' => 50.00,
                'is_active' => true,
            ],
        );

        $serviceBeardTrim2 = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch2->id, 'name' => 'Beard Trim'],
            [
                'duration_minutes' => 15,
                'price' => 20.00,
                'is_active' => true,
            ],
        );

        $serviceFullService2 = Service::firstOrCreate(
            ['business_id' => $business->id, 'branch_id' => $branch2->id, 'name' => 'Full Service'],
            [
                'duration_minutes' => 60,
                'price' => 100.00,
                'is_active' => true,
            ],
        );

        $staffAhmed->services()->syncWithoutDetaching([$serviceHaircut->id, $serviceFullService->id]);
        $staffKarim->services()->syncWithoutDetaching([$serviceBeardTrim->id, $serviceFullService->id]);
        $staffOmar->services()->syncWithoutDetaching([
            $serviceHaircut->id,
            $serviceBeardTrim->id,
            $serviceFullService->id,
        ]);

        $staffHassan->services()->syncWithoutDetaching([
            $serviceHaircut2->id,
            $serviceBeardTrim2->id,
        ]);
        $staffOmar->services()->syncWithoutDetaching([
            $serviceHaircut2->id,
            $serviceBeardTrim2->id,
            $serviceFullService2->id,
        ]);

        $customers = [];
        $phoneNumbers = [
            '+201001111111' => 'Mohammed',
            '+201001111112' => 'Ali',
            '+201001111113' => 'Hassan',
            '+201001111114' => 'Sara',
            '+201001111115' => 'Fatima',
        ];

        foreach ($phoneNumbers as $phone => $name) {
            $customer = Customer::firstOrCreate(
                ['business_id' => $business->id, 'phone' => $phone],
                [
                    'name' => $name,
                    'otp_verified_at' => now(),
                ],
            );
            $customers[] = $customer;
        }

        $now = now('Africa/Cairo');

        for ($i = 0; $i < 5; $i++) {
            $startsAt = $now->clone()->addDays(($i % 3) + 1)->setHour(10 + $i)->setMinute(0);
            $endsAt = $startsAt->clone()->addMinutes(30);

            Booking::firstOrCreate(
                [
                    'business_id' => $business->id,
                    'customer_id' => $customers[$i % count($customers)]->id,
                    'starts_at' => $startsAt,
                ],
                [

                'branch_id' => $i % 2 === 0 ? $branch1->id : $branch2->id,
                     'service_id' => $i % 2 === 0 ? [$serviceHaircut->id, $serviceBeardTrim->id][$i % 2] : [$serviceHaircut2->id, $serviceBeardTrim2->id][$i % 2],
                     'staff_id' => $i % 2 === 0 ? [$staffAhmed->id, $staffKarim->id, $staffOmar->id][$i % 3] : [$staffHassan->id][$i % 1],
                    'ends_at' => $endsAt,
                    'status' => BookingStatus::Confirmed,
                    'source' => BookingSource::Online,
                ],
            );
        }

        for ($i = 0; $i < 3; $i++) {
            $startsAt = $now->clone()->subDays(7 + $i)->setHour(11)->setMinute(0);
            $endsAt = $startsAt->clone()->addMinutes(30);

            Booking::firstOrCreate(
                [
                    'business_id' => $business->id,
                    'customer_id' => $customers[$i]->id,
                    'starts_at' => $startsAt,
                ],
                [
                    'branch_id' => $branch1->id,
                    'service_id' => $serviceHaircut->id,
                    'staff_id' => $staffAhmed->id,
                    'ends_at' => $endsAt,
                    'status' => BookingStatus::Completed,
                    'source' => BookingSource::Online,
                ],
            );
        }

        $startsAt = $now->clone()->subDays(2)->setHour(14)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(15);
        Booking::firstOrCreate(
            [
                'business_id' => $business->id,
                'customer_id' => $customers[3]->id,
                'starts_at' => $startsAt,
            ],
            [
                'branch_id' => $branch2->id,
                'service_id' => $serviceBeardTrim2->id,
                'staff_id' => $staffHassan->id,
                'ends_at' => $endsAt,
                'status' => BookingStatus::NoShow,
                'source' => BookingSource::Manual,
            ],
        );

        $startsAt = $now->clone()->subDays(1)->setHour(15)->setMinute(0);
        $endsAt = $startsAt->clone()->addMinutes(60);
        Booking::firstOrCreate(
            [
                'business_id' => $business->id,
                'customer_id' => $customers[4]->id,
                'starts_at' => $startsAt,
            ],
            [
                'branch_id' => $branch1->id,
                'service_id' => $serviceFullService->id,
                'staff_id' => $staffOmar->id,
                'ends_at' => $endsAt,
                'status' => BookingStatus::Cancelled,
                'source' => BookingSource::Online,
            ],
        );

        $this->command->info('Demo data seeded: demo-barbershop (owner: owner@demo.local / password)');
    }
}
