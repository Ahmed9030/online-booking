<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessResource extends JsonResource
{
    /**
     * Transform the business resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo_url' => $this->logo_url,
            'description' => $this->description,
            'subscription_status' => $this->subscription_status?->value,
            'subscription_expires_at' => $this->subscription_expires_at?->toIso8601String(),
            'subscription_days_remaining' => $this->subscription_expires_at
                ? max(0, now()->diffInDays($this->subscription_expires_at))
                : 0,
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
                'phone' => $this->owner->phone,
            ]),
            'branches_count' => $this->whenCounted('branches'),
            'staff_count' => $this->whenCounted('staff'),
            'services_count' => $this->whenCounted('services'),
            'bookings_count' => $this->whenCounted('bookings'),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
