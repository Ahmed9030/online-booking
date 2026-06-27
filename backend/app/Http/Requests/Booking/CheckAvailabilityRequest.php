<?php

declare(strict_types=1);

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class CheckAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id'  => ['required', 'uuid', 'exists:branches,id'],
            'service_id' => ['required', 'uuid', 'exists:services,id'],
            'staff_id'   => ['nullable', 'uuid', 'exists:staff,id'],
            'date'       => ['required', 'date', 'after_or_equal:today'],
        ];
    }
}
