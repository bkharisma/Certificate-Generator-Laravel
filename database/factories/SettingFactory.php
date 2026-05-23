<?php

namespace Database\Factories;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Factories\Factory;

class SettingFactory extends Factory
{
    protected $model = Setting::class;

    public function definition(): array
    {
        return [
            'key' => fake()->unique()->word(),
            'value' => fake()->sentence(),
        ];
    }

    public function appUrl(): static
    {
        return $this->state(fn () => ['key' => 'app_url', 'value' => 'http://localhost']);
    }

    public function orgName(): static
    {
        return $this->state(fn () => ['key' => 'org_name', 'value' => 'Test Organization']);
    }
}
