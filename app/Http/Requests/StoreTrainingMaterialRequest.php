<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTrainingMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('columns'))) {
            $this->merge([
                'columns' => json_decode($this->input('columns'), true) ?? [],
            ]);
        }
        if (is_string($this->input('rows'))) {
            $this->merge([
                'rows' => json_decode($this->input('rows'), true) ?? [],
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'columns' => ['required', 'array', 'min:1'],
            'columns.*' => ['required', 'string', 'max:255'],
            'rows' => ['nullable', 'array'],
            'rows.*' => ['array'],
            'background_image' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'columns.min' => 'At least one column is required.',
            'columns.*.required' => 'Column name cannot be empty.',
        ];
    }
}
