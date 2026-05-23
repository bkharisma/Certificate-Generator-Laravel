<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Recipient;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecipientFactory extends Factory
{
    protected $model = Recipient::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'certificate_number' => fake()->unique()->regexify('[a-z]+/\d{3}'),
            'certificate_path' => null,
            'status' => 'pending',
            'email_status' => 'pending',
            'email_sent_at' => null,
            'revoked_at' => null,
            'revoke_reason' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending']);
    }

    public function generated(): static
    {
        return $this->state(fn () => [
            'status' => 'generated',
            'certificate_path' => 'certificates/1/test_001.pdf',
        ]);
    }

    public function sent(): static
    {
        return $this->state(fn () => [
            'status' => 'sent',
            'email_status' => 'sent',
            'email_sent_at' => now(),
            'certificate_path' => 'certificates/1/test_001.pdf',
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn () => [
            'status' => 'revoked',
            'revoked_at' => now(),
            'revoke_reason' => 'Issued in error',
            'certificate_path' => 'certificates/1/test_001.pdf',
        ]);
    }
}
