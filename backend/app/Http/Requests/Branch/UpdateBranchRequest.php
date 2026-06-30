<?php

declare(strict_types=1);

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to update a branch.
     * Only authenticated owners can update branches.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role->value === 'owner';
    }

    /**
     * Get the validation rules for updating a branch.
     *
     * @return array<string, string|string[]>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:3', 'max:100'],
            'address' => ['sometimes', 'string', 'min:5'],
            'city' => ['sometimes', 'string', 'max:50'],
            'whatsapp_number' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'slug' => [
                'sometimes',
                'string',
                'regex:/^[a-z0-9\-]+$/',
            ],
        ];
    }
}
