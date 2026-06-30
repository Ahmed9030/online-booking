<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Data\CreateBookingData;
use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Events\BookingCreated;
use App\Exceptions\SlotNotAvailableException;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Service;
use App\Services\AvailabilityService;
use Illuminate\Support\Facades\DB;

final class CreateBookingAction
{
    /**
     * @param  AssignAvailableStaffAction  $assignStaff   Service to auto-assign staff.
     * @param  AvailabilityService         $availability  Service to verify slot availability.
     */
    public function __construct(
        private readonly AssignAvailableStaffAction $assignStaff,
        private readonly AvailabilityService $availability,
    ) {}

    /**
     * Create a new booking, validate times, auto-assign staff if not specified,
     * and dispatch the BookingCreated event after the database transaction commits.
     *
     * @throws \InvalidArgumentException      If start/end times are invalid or in the past.
     * @throws SlotNotAvailableException      If no staff or time slot is available.
     */
    public function handle(CreateBookingData $data): Booking
    {
        $booking = DB::transaction(function () use ($data) {
            $branch = Branch::findOrFail($data->branchId);
            $service = Service::findOrFail($data->serviceId);
            $customer = Customer::findOrFail($data->customerId);

            if ($service->branch_id !== $branch->id) {
                throw new \InvalidArgumentException('Service does not belong to the selected branch.');
            }

            if ($data->startsAt->greaterThanOrEqualTo($data->endsAt)) {
                throw new \InvalidArgumentException('Start time must be before end time.');
            }

            if ($data->startsAt->lessThanOrEqualTo(now('Africa/Cairo'))) {
                throw new \InvalidArgumentException('Cannot book in the past.');
            }

            $staffId = $data->staffId;
            if ($staffId) {
                $staff = \App\Models\Staff::findOrFail($staffId);
                if ($staff->branch_id !== $branch->id) {
                    throw new \InvalidArgumentException('Staff member does not belong to the selected branch.');
                }
                if (!$staff->services()->where('service_id', $service->id)->exists()) {
                    throw new \InvalidArgumentException('Staff member cannot perform the selected service.');
                }
            } else {
                $staff = $this->assignStaff->handle(
                    $branch,
                    $service,
                    $data->startsAt,
                    $data->endsAt,
                );

                $staffId = $staff?->id;

                if (! $staffId) {
                    throw new SlotNotAvailableException('No staff available for this service at the requested time.');
                }
            }

            $this->availability->assertSlotAvailable($staffId, $data->startsAt, $data->endsAt);

            return Booking::create([
                'business_id' => $data->businessId,
                'branch_id' => $data->branchId,
                'customer_id' => $data->customerId,
                'service_id' => $data->serviceId,
                'staff_id' => $staffId,
                'starts_at' => $data->startsAt->setTimezone('UTC'),
                'ends_at' => $data->endsAt->setTimezone('UTC'),
                'status' => BookingStatus::Confirmed,
                'source' => BookingSource::from($data->source),
                'notes' => $data->notes,
                'created_by_user_id' => auth()?->id(),
            ]);
        });

        // Dispatch event after commit to ensure booking is visible to dependent jobs
        DB::afterCommit(function () use ($booking) {
            event(new BookingCreated($booking));
        });

        return $booking;
    }
}
