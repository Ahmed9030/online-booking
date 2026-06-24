<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole('owner');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'price' => 'required|numeric|min:0.01',
        ];
    }

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
