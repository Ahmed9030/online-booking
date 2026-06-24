<?php

declare(strict_types=1);

namespace App\Actions\Bookings;

use App\Data\CreateBookingData;
use App\Enums\BookingStatus;
use App\Enums\BookingSource;
use App\Events\BookingCreated;
use App\Exceptions\SlotNotAvailableException;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Service;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

final class CreateBookingAction
{
    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly AssignAvailableStaffAction $assignStaff,
    ) {}

    /**
     * Create a booking with full validation and conflict checking.
     *
     * @throws SlotNotAvailableException
     * @throws \InvalidArgumentException
     */
    public function handle(CreateBookingData $data): Booking
    {
        return DB::transaction(function () use ($data) {
            $branch = Branch::findOrFail($data->branchId);
            $service = Service::findOrFail($data->serviceId);
            $customer = Customer::findOrFail($data->customerId);

            if ($data->startsAt->greaterThanOrEqualTo($data->endsAt)) {
                throw new \InvalidArgumentException('Start time must be before end time.');
            }

            if ($data->startsAt->lessThanOrEqualTo(now('Africa/Cairo'))) {
                throw new \InvalidArgumentException('Cannot book in the past.');
            }

            $staffId = $data->staffId;
            if (! $staffId) {
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

            $booking = Booking::create([
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

            event(new BookingCreated($booking));

            return $booking;
        });
    }
}
