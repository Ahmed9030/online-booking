<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole('owner');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'branch_id' => 'required|uuid|exists:branches,id',
            'user_id' => 'nullable|uuid|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Staff name is required.',
            'branch_id.required' => 'Branch is required.',
            'branch_id.exists' => 'The selected branch does not exist.',
            'user_id.exists' => 'The selected user does not exist.',
        ];
    }
}
