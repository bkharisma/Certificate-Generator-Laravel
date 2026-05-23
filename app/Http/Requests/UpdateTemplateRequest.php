<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'page_width' => ['sometimes', 'required', 'numeric', 'min:50', 'max:1000'],
            'page_height' => ['sometimes', 'required', 'numeric', 'min:50', 'max:1000'],
            'orientation' => ['sometimes', 'required', 'in:landscape,portrait'],
            'background' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'background.max' => 'Background image must not exceed 10MB.',
            'background.mimes' => 'Background must be a PNG or JPG image.',
        ];
    }
}
