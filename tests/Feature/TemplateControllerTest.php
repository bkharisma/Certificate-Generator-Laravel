<?php

namespace Tests\Feature;

use App\Models\Template;
use App\Models\TemplateElement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TemplateControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'operator', 'guard_name' => 'web']);
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    public function test_index_returns_templates_page(): void
    {
        Template::factory()->count(3)->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->get(route('templates.index'))
            ->assertInertia(fn ($page) => $page
                ->component('Templates/Index')
                ->has('templates.data', 3)
            );
    }

    public function test_create_returns_form(): void
    {
        $this->actingAs($this->admin)
            ->get(route('templates.create'))
            ->assertInertia(fn ($page) => $page->component('Templates/Create'));
    }

    public function test_store_creates_template(): void
    {
        Storage::fake('public');

        $this->actingAs($this->admin)
            ->post(route('templates.store'), [
                'name' => 'Test Template',
                'page_width' => 297,
                'page_height' => 210,
                'orientation' => 'landscape',
                'background' => UploadedFile::fake()->image('bg.png', 800, 600),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('templates', [
            'name' => 'Test Template',
            'page_width' => 297,
            'page_height' => 210,
            'orientation' => 'landscape',
        ]);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAs($this->admin)
            ->post(route('templates.store'), [])
            ->assertSessionHasErrors(['name', 'page_width', 'page_height', 'orientation']);
    }

    public function test_store_validates_orientation(): void
    {
        $this->actingAs($this->admin)
            ->post(route('templates.store'), [
                'name' => 'Test',
                'page_width' => 297,
                'page_height' => 210,
                'orientation' => 'invalid',
            ])
            ->assertSessionHasErrors(['orientation']);
    }

    public function test_show_displays_template(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->get(route('templates.show', $template))
            ->assertInertia(fn ($page) => $page
                ->component('Templates/Show')
                ->has('template')
            );
    }

    public function test_designer_returns_designer_page(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->get(route('templates.designer', $template))
            ->assertInertia(fn ($page) => $page
                ->component('Templates/Designer')
                ->has('template')
            );
    }

    public function test_update_modifies_template(): void
    {
        $template = Template::factory()->create([
            'created_by' => $this->admin->id,
            'name' => 'Original Name',
        ]);

        $this->actingAs($this->admin)
            ->put(route('templates.update', $template), [
                'name' => 'Updated Name',
                'page_width' => 210,
                'page_height' => 297,
                'orientation' => 'portrait',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('templates', [
            'id' => $template->id,
            'name' => 'Updated Name',
            'page_width' => 210,
            'page_height' => 297,
            'orientation' => 'portrait',
        ]);
    }

    public function test_destroy_deletes_template(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->delete(route('templates.destroy', $template))
            ->assertRedirect();

        $this->assertDatabaseMissing('templates', ['id' => $template->id]);
    }

    public function test_background_upload_replaces_image(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create([
            'created_by' => $this->admin->id,
            'background_image' => null,
        ]);

        $file = UploadedFile::fake()->image('new-bg.png', 800, 600);

        $this->actingAs($this->admin)
            ->post(route('templates.background', $template), [
                'background' => $file,
            ])
            ->assertRedirect();

        $template->refresh();
        $this->assertNotNull($template->background_image);
        Storage::disk('public')->assertExists($template->background_image);
    }

    public function test_elements_saves_element_positions(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);

        $elements = [
            [
                'type' => 'title',
                'label' => 'Title',
                'x' => 50, 'y' => 30, 'width' => 200, 'height' => 15,
                'font_size' => 18, 'font_family' => 'Arial', 'font_color' => '#000000',
                'font_style' => 'bold', 'text_align' => 'center', 'sort_order' => 1,
            ],
            [
                'type' => 'recipient_name',
                'label' => 'Name',
                'x' => 50, 'y' => 80, 'width' => 200, 'height' => 15,
                'font_size' => 24, 'font_family' => 'Times New Roman', 'font_color' => '#333333',
                'font_style' => 'normal', 'text_align' => 'center', 'sort_order' => 2,
            ],
        ];

        $this->actingAs($this->admin)
            ->post(route('templates.elements', $template), [
                'elements' => $elements,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('template_elements', 2);
        $this->assertDatabaseHas('template_elements', [
            'template_id' => $template->id,
            'type' => 'title',
            'x' => 50,
        ]);
        $this->assertDatabaseHas('template_elements', [
            'template_id' => $template->id,
            'type' => 'recipient_name',
            'font_family' => 'Times New Roman',
        ]);
    }

    public function test_elements_replaces_old_elements(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->count(3)->create(['template_id' => $template->id]);

        $this->actingAs($this->admin)
            ->post(route('templates.elements', $template), [
                'elements' => [
                    [
                        'type' => 'title', 'label' => 'New Title',
                        'x' => 10, 'y' => 10, 'width' => 100, 'height' => 10,
                        'sort_order' => 1,
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('template_elements', 1);
    }

    public function test_preview_returns_inertia_page(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->count(2)->create(['template_id' => $template->id]);

        $this->actingAs($this->admin)
            ->get(route('templates.preview', $template))
            ->assertInertia(fn ($page) => $page
                ->component('Templates/Show')
                ->has('template')
            );
    }

    public function test_unauthenticated_user_cannot_access_templates(): void
    {
        $this->get(route('templates.index'))->assertRedirect(route('login'));
        $this->get(route('templates.create'))->assertRedirect(route('login'));
        $this->post(route('templates.store'), [])->assertRedirect(route('login'));
    }
}
