<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'address'          => $this->address,
            'city'             => $this->city,
            'whatsapp_number'  => $this->whatsapp_number,
            'slug'             => $this->slug,
            'is_active'        => $this->is_active,
            'working_hours'    => $this->whenLoaded('workingHours', function () {
                return $this->workingHours->map(fn ($h) => [
                    'weekday'    => $h->weekday,
                    'open_time'  => $h->open_time,
                    'close_time' => $h->close_time,
                ]);
            }),
            'created_at'       => $this->created_at,
        ];
    }
}
