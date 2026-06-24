<?php

declare(strict_types=1);

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role->value === 'owner';
    }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'min:3', 'max:100'],
            'address'          => ['required', 'string', 'min:5'],
            'city'             => ['required', 'string', 'max:50'],
            'whatsapp_number'  => ['required', 'string'],
            'slug'             => [
                'required',
                'string',
                'regex:/^[a-z0-9\-]+$/',
                'unique:branches,slug,NULL,id,business_id,' . auth()->user()?->business_id,
            ],
        ];
    }
}
