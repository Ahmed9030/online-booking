<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\CheckAvailabilityRequest;
use App\Models\Branch;
use App\Models\Service;
use App\Models\Staff;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AvailabilityController extends Controller
{
    /**
     * @param  AvailabilityService  $availability  Service to check slot availability.
     */
    public function __construct(
        private readonly AvailabilityService $availability,
    ) {}

    /**
     * Check available slots for a service on a date.
     * POST /api/v1/public/availability/check
     *
     * Request body:
     * {
     *   "branch_id": "uuid",
     *   "service_id": "uuid",
     *   "staff_id": "uuid (optional, null for any available)",
     *   "date": "2026-06-25"
     * }
     */
    public function check(CheckAvailabilityRequest $request): JsonResponse
    {
        $branch = Branch::findOrFail($request->validated('branch_id'));
        $service = Service::findOrFail($request->validated('service_id'));

        $staff = null;
        if ($request->validated('staff_id')) {
            $staff = Staff::findOrFail($request->validated('staff_id'));
        }

        $date = Carbon::parse($request->validated('date'))->setTimezone('Africa/Cairo');

        $slots = $this->availability->getAvailableSlots($branch, $service, $staff, $date);

        return response()->json([
            'data' => [
                'slots' => $slots,
                'total_available' => $slots->count(),
            ],
        ]);
    }
}
