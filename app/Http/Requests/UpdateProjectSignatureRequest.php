<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectSignatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'signature' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
            'signer_name' => ['sometimes', 'required', 'string', 'max:255'],
            'signer_title' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
