<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function view(User $user, Booking $booking): bool
    {
        // Owner can view all bookings in their business
        if ($user->hasRole('owner') && $user->business_id === $booking->business_id) {
            return true;
        }

        // Staff can view only their own bookings
        if ($user->hasRole('staff') && $user->staff_id === $booking->staff_id) {
            return true;
        }

        // Customer can view only their own bookings
        if ($user->hasRole('customer') && $user->id === $booking->customer->user_id) {
            return true;
        }

        return false;
    }

    public function updateStatus(User $user, Booking $booking): bool
    {
        // Only owner and staff can update booking status
        if ($user->hasRole('owner') && $user->business_id === $booking->business_id) {
            return true;
        }

        if ($user->hasRole('staff') && $user->staff_id === $booking->staff_id) {
            return true;
        }

        return false;
    }

    public function cancel(User $user, Booking $booking): bool
    {
        // Owner can cancel any booking in their business
        if ($user->hasRole('owner') && $user->business_id === $booking->business_id) {
            return true;
        }

        // Staff can cancel only their own bookings
        if ($user->hasRole('staff') && $user->staff_id === $booking->staff_id) {
            return true;
        }

        // Customer can cancel only their own bookings
        if ($user->hasRole('customer') && $user->id === $booking->customer->user_id) {
            return true;
        }

        return false;
    }
}
