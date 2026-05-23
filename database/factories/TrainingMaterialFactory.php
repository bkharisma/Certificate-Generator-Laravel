<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\TrainingMaterial;
use Illuminate\Database\Eloquent\Factories\Factory;

class TrainingMaterialFactory extends Factory
{
    protected $model = TrainingMaterial::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'columns' => ['No', 'Materi', 'Nilai', 'Keterangan'],
            'rows' => [
                ['No' => '1', 'Materi' => 'First Aid', 'Nilai' => '90', 'Keterangan' => 'Lulus'],
                ['No' => '2', 'Materi' => 'Fire Safety', 'Nilai' => '85', 'Keterangan' => 'Lulus'],
            ],
        ];
    }
}
