<?php

use App\Jobs\SendAppointmentReminders;
use App\Jobs\SendDailySummary;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new SendAppointmentReminders)
    ->dailyAt('08:00')
    ->timezone('Africa/Cairo');

Schedule::job(new SendDailySummary)
    ->dailyAt('18:00')
    ->timezone('Africa/Cairo');
