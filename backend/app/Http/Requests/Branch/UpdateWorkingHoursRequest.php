<?php

declare(strict_types=1);

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkingHoursRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role->value === 'owner';
    }

    public function rules(): array
    {
        return [
            'working_hours' => ['required', 'array', 'min:1'],
            'working_hours.*.weekday' => ['required', 'integer', 'between:0,6'],
            'working_hours.*.open_time' => ['nullable', 'date_format:H:i'],
            'working_hours.*.close_time' => ['nullable', 'date_format:H:i'],
        ];
    }
}
