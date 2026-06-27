<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::default()],
            'business_name' => ['required', 'string', 'min:3', 'max:100'],
            'branch_name' => ['required', 'string', 'min:3', 'max:100'],
            'branch_address' => ['required', 'string', 'min:5'],
            'city' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.confirmed' => 'كلمات المرور غير متطابقة',
        ];
    }
}
