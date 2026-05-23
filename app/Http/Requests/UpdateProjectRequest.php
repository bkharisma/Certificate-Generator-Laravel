<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'template_id' => ['sometimes', 'required', 'exists:templates,id'],
            'title_text' => ['nullable', 'string', 'max:500'],
            'certificate_date' => ['nullable', 'date'],
            'certificate_prefix' => ['sometimes', 'required', 'string', 'max:100'],
            'certificate_digit_count' => ['sometimes', 'required', 'integer', 'in:3,4'],
            'email_subject' => ['nullable', 'string', 'max:500'],
            'email_body' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', 'in:draft,active,completed'],
        ];
    }
}
