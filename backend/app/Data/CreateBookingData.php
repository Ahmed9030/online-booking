<?php

declare(strict_types=1);

namespace App\Data;

use Carbon\Carbon;
use Illuminate\Http\Request;

final class CreateBookingData
{
    /**
     * @param  string       $businessId  The business UUID.
     * @param  string       $branchId    The branch UUID.
     * @param  string       $serviceId   The service UUID.
     * @param  string       $customerId  The customer UUID.
     * @param  Carbon       $startsAt    Booking start datetime (Cairo timezone).
     * @param  Carbon       $endsAt      Booking end datetime (Cairo timezone).
     * @param  string|null  $staffId     Optional staff UUID.
     * @param  string       $source      Booking source (online|manual).
     * @param  string|null  $notes       Optional booking notes.
     */
    public function __construct(
        public readonly string $businessId,
        public readonly string $branchId,
        public readonly string $serviceId,
        public readonly string $customerId,
        public readonly Carbon $startsAt,
        public readonly Carbon $endsAt,
        public readonly ?string $staffId = null,
        public readonly string $source = 'online',
        public readonly ?string $notes = null,
    ) {}

    /**
     * Create a CreateBookingData instance from a validated request.
     *
     * @param  Request  $request  The validated incoming request.
     * @return self
     */
    public static function fromRequest(Request $request): self
    {
        return new self(
            businessId: auth()->user()->business_id,
            branchId: $request->validated('branch_id'),
            serviceId: $request->validated('service_id'),
            customerId: $request->validated('customer_id'),
            startsAt: Carbon::parse($request->validated('starts_at'))->setTimezone('Africa/Cairo'),
            endsAt: Carbon::parse($request->validated('ends_at'))->setTimezone('Africa/Cairo'),
            staffId: $request->validated('staff_id'),
            source: $request->validated('source', 'online'),
            notes: $request->validated('notes'),
        );
    }
}
