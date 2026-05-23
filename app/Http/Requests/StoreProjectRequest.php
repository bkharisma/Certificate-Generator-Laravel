<?php

namespace App\Http\Requests;

use App\Models\Template;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'template_id' => [
                'required',
                'exists:templates,id',
                function ($attribute, $value, $fail) {
                    $template = Template::find($value);
                    if (!$template || (!$this->user()->isAdmin() && $template->created_by !== $this->user()->id)) {
                        $fail('The selected template does not belong to you.');
                    }
                },
            ],
            'title_text' => ['nullable', 'string', 'max:500'],
            'certificate_date' => ['nullable', 'date'],
            'certificate_prefix' => ['required', 'string', 'max:100'],
            'certificate_digit_count' => ['required', 'integer', 'in:3,4'],
            'email_subject' => ['nullable', 'string', 'max:500'],
            'email_body' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'template_id.exists' => 'The selected template does not exist.',
            'certificate_digit_count.in' => 'Digit count must be 3 or 4.',
        ];
    }
}
