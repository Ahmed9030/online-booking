<?php

declare(strict_types=1);

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a branch.
     * Only authenticated owners can create branches.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role->value === 'owner';
    }

    /**
     * Get the validation rules for storing a new branch.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'address' => ['required', 'string', 'min:5'],
            'city' => ['required', 'string', 'max:50'],
            'whatsapp_number' => ['required', 'string'],
            'slug' => [
                'required',
                'string',
                'regex:/^[a-z0-9\-]+$/',
                'unique:branches,slug,NULL,id,business_id,'.auth()->user()?->business_id,
            ],
        ];
    }
}
