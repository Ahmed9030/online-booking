<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole('owner');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'whatsapp_number' => 'required|string|regex:/^(\+201|01|00201)[0-9]{9}$/',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Branch name is required.',
            'address.required' => 'Branch address is required.',
            'whatsapp_number.regex' => 'WhatsApp number must be in Egyptian format.',
        ];
    }
}
