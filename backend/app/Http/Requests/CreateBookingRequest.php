<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a booking.
     * Public endpoint — no authentication required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules for creating a booking.
     *
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'service_id' => 'required|uuid|exists:services,id',
            'staff_id' => 'nullable|uuid|exists:staff,id',
            'starts_at' => 'required|date|after:now',
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'service_id.required' => 'Service is required.',
            'service_id.exists' => 'The selected service does not exist.',
            'starts_at.after' => 'Booking start time must be in the future.',
        ];
    }
}
