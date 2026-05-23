<?php

namespace Database\Factories;

use App\Models\Template;
use App\Models\TemplateElement;
use Illuminate\Database\Eloquent\Factories\Factory;

class TemplateElementFactory extends Factory
{
    protected $model = TemplateElement::class;

    public function definition(): array
    {
        return [
            'template_id' => Template::factory(),
            'type' => 'recipient_name',
            'label' => 'Recipient Name',
            'x' => fake()->randomFloat(2, 10, 200),
            'y' => fake()->randomFloat(2, 10, 150),
            'width' => fake()->randomFloat(2, 30, 100),
            'height' => fake()->randomFloat(2, 8, 20),
            'font_size' => 24,
            'font_family' => 'Arial',
            'font_color' => '#000000',
            'font_style' => 'bold',
            'text_align' => 'center',
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }

    public function title(): static
    {
        return $this->state(fn () => [
            'type' => 'title',
            'label' => 'Title',
            'font_size' => 18,
            'font_style' => 'bold',
            'sort_order' => 1,
        ]);
    }

    public function recipientName(): static
    {
        return $this->state(fn () => [
            'type' => 'recipient_name',
            'label' => 'Recipient Name',
            'font_size' => 24,
            'font_style' => 'bold',
            'sort_order' => 2,
        ]);
    }

    public function date(): static
    {
        return $this->state(fn () => [
            'type' => 'date',
            'label' => 'Date',
            'font_size' => 12,
            'font_style' => 'normal',
            'sort_order' => 3,
        ]);
    }

    public function certificateNumber(): static
    {
        return $this->state(fn () => [
            'type' => 'certificate_number',
            'label' => 'Certificate No.',
            'font_size' => 10,
            'font_style' => 'normal',
            'sort_order' => 4,
        ]);
    }

    public function qrCode(): static
    {
        return $this->state(fn () => [
            'type' => 'qr_code',
            'label' => 'QR Code',
            'width' => 30,
            'height' => 30,
            'sort_order' => 5,
        ]);
    }

    public function signature(): static
    {
        return $this->state(fn () => [
            'type' => 'signature',
            'label' => 'Signature',
            'width' => 50,
            'height' => 20,
            'sort_order' => 6,
        ]);
    }

    public function logo(): static
    {
        return $this->state(fn () => [
            'type' => 'logo',
            'label' => 'Logo',
            'width' => 30,
            'height' => 30,
            'sort_order' => 7,
        ]);
    }
}
