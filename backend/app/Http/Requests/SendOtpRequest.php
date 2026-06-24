<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => [
                'required',
                'regex:/^(\+201|01|00201)[0-9]{9}$|^(\+966|966|0)[5-9][0-9]{8}$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Phone number is required.',
            'phone.regex' => 'Phone number must be in Egyptian (+20...) or GCC format.',
        ];
    }
}
