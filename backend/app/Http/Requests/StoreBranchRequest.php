<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a branch.
     * Only authenticated owners can create branches.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole('owner');
    }

    /**
     * Get the validation rules for storing a new branch.
     *
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'whatsapp_number' => 'required|string|regex:/^(\+201|01|00201)[0-9]{9}$/',
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
            'name.required' => 'Branch name is required.',
            'address.required' => 'Branch address is required.',
            'whatsapp_number.regex' => 'WhatsApp number must be in Egyptian format.',
        ];
    }
}
