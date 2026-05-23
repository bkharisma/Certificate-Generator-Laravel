<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'template_id' => Template::factory(),
            'certificate_prefix' => fake()->randomElement(['psdp', 'training', 'cert']),
            'certificate_digit_count' => 3,
            'certificate_next_number' => 1,
            'certificate_date' => null,
            'title_text' => 'Certificate of Completion',
            'email_subject' => null,
            'email_body' => null,
            'status' => 'draft',
            'created_by' => User::factory(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => ['status' => 'active']);
    }

    public function completed(): static
    {
        return $this->state(fn () => ['status' => 'completed']);
    }
}
