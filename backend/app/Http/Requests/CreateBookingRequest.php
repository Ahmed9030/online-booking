<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => 'required|uuid|exists:services,id',
            'staff_id' => 'nullable|uuid|exists:staff,id',
            'starts_at' => 'required|date|after:now',
        ];
    }

    public function messages(): array
    {
        return [
            'service_id.required' => 'Service is required.',
            'service_id.exists' => 'The selected service does not exist.',
            'starts_at.after' => 'Booking start time must be in the future.',
        ];
    }
}
