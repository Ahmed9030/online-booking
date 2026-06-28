<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create staff.
     * Only authenticated owners can create staff members.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasRole('owner');
    }

    /**
     * Get the validation rules for storing a new staff member.
     *
     * @return array<string, string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'branch_id' => 'required|uuid|exists:branches,id',
            'user_id' => 'nullable|uuid|exists:users,id',
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
            'name.required' => 'Staff name is required.',
            'branch_id.required' => 'Branch is required.',
            'branch_id.exists' => 'The selected branch does not exist.',
            'user_id.exists' => 'The selected user does not exist.',
        ];
    }
}
