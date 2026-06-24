<?php

declare(strict_types=1);

namespace App\Data;

use Carbon\Carbon;
use Illuminate\Http\Request;

final class CreateBookingData
{
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
