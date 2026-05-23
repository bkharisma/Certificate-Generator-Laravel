<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectLogo;
use App\Models\TemplateElement;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectLogoFactory extends Factory
{
    protected $model = ProjectLogo::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'template_element_id' => TemplateElement::factory(),
            'logo_image' => 'projects/1/logos/logo.png',
            'sort_order' => 1,
        ];
    }
}
