<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectSignature;
use App\Models\TemplateElement;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectSignatureFactory extends Factory
{
    protected $model = ProjectSignature::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'template_element_id' => TemplateElement::factory(),
            'signature_image' => 'projects/1/signatures/sig.png',
            'signer_name' => fake()->name(),
            'signer_title' => fake()->jobTitle(),
            'sort_order' => 1,
        ];
    }
}
