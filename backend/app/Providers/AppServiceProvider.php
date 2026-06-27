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
        //
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
            \Illuminate\Support\Facades\Gate::policy($model, $policy);
        }
    }
}
