<?php

namespace Database\Factories;

use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TemplateFactory extends Factory
{
    protected $model = Template::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true) . ' Template',
            'page_width' => 297,
            'page_height' => 210,
            'orientation' => 'landscape',
            'background_image' => null,
            'created_by' => User::factory(),
        ];
    }
}
