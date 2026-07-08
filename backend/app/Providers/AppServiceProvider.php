<?php

namespace App\Providers;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Service;
use App\Models\Staff;
use App\Policies\BookingPolicy;
use App\Policies\BranchPolicy;
use App\Policies\BusinessPolicy;
use App\Policies\ServicePolicy;
use App\Policies\StaffPolicy;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     */
    protected $policies = [
        Business::class => BusinessPolicy::class,
        Branch::class => BranchPolicy::class,
        Staff::class => StaffPolicy::class,
        Service::class => ServicePolicy::class,
        Booking::class => BookingPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(Client::class, function () {
            return new Client([
                'timeout' => 10,
                'connect_timeout' => 5,
            ]);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }

    /**
     * Register the policies for the application.
     */
    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }
}
