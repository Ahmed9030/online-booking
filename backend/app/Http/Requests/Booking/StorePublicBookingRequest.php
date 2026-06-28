<?php

declare(strict_types=1);

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StorePublicBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'service_id' => ['required', 'uuid', 'exists:services,id'],
            'staff_id' => ['nullable', 'uuid', 'exists:staff,id'],
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            'customer_phone' => [
                'required',
                'string',
                'regex:/^(\+20|0)?1[0-2,5]\d{8}$/', // Egyptian phone format
            ],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_phone.regex' => 'رقم الهاتف يجب أن يكون رقم مصري صحيح',
            'starts_at.after' => 'لا يمكن الحجز في الماضي',
        ];
    }
}
