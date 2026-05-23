<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectLogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_element_id' => ['required', 'exists:template_elements,id'],
            'logo' => ['required', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:1', 'max:4'],
        ];
    }
}
