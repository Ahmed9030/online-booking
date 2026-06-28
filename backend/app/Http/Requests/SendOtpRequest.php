<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Public endpoint — no authentication required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules for sending an OTP.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'phone' => [
                'required',
                'regex:/^(\+201|01|00201)[0-9]{9}$|^(\+966|966|0)[5-9][0-9]{8}$/',
            ],
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
            'phone.required' => 'Phone number is required.',
            'phone.regex' => 'Phone number must be in Egyptian (+20...) or GCC format.',
        ];
    }
}
