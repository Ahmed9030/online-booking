<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a service.
     * Only authenticated owners can create services.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole('owner');
    }

    /**
     * Get the validation rules for storing a new service.
     *
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'price' => 'required|numeric|min:0.01',
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
            'name.required' => 'Service name is required.',
            'duration_minutes.required' => 'Duration is required.',
            'duration_minutes.min' => 'Duration must be at least 15 minutes.',
            'price.required' => 'Price is required.',
            'price.min' => 'Price must be greater than zero.',
        ];
    }
}
