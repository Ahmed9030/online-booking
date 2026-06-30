<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetWorkingHoursRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to set working hours.
     * Only authenticated owners can set working hours.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole('owner');
    }

    /**
     * Get the validation rules for setting working hours.
     *
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'day_of_week' => 'required|integer|between:0,6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
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
            'day_of_week.required' => 'Day of week is required.',
            'day_of_week.between' => 'Day of week must be between 0 (Sunday) and 6 (Saturday).',
            'start_time.required' => 'Start time is required.',
            'end_time.after' => 'End time must be after start time.',
        ];
    }
}
