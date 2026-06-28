<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    /**
     * Transform the booking resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'source' => $this->source->value,
            'starts_at' => $this->starts_at->setTimezone('Africa/Cairo')->toIso8601String(),
            'ends_at' => $this->ends_at->setTimezone('Africa/Cairo')->toIso8601String(),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'service' => new ServiceResource($this->whenLoaded('service')),
            'staff' => new StaffResource($this->whenLoaded('staff')),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
