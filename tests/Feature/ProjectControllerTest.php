<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Recipient;
use App\Models\Template;
use App\Models\TemplateElement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProjectControllerTest extends TestCase
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

    public function test_index_returns_projects_page(): void
    {
        Template::factory()->count(2)->create(['created_by' => $this->admin->id]);
        Project::factory()->count(3)->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->get(route('projects.index'))
            ->assertInertia(fn ($page) => $page
                ->component('Projects/Index')
                ->has('projects.data', 3)
            );
    }

    public function test_create_returns_form_with_templates(): void
    {
        Template::factory()->count(2)->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->get(route('projects.create'))
            ->assertInertia(fn ($page) => $page
                ->component('Projects/Create')
                ->has('templates', 2)
            );
    }

    public function test_store_creates_project(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->post(route('projects.store'), [
                'name' => 'Test Project',
                'template_id' => $template->id,
                'title_text' => 'Certificate of Completion',
                'certificate_date' => '2026-06-01',
                'certificate_prefix' => 'psdp',
                'certificate_digit_count' => 3,
                'email_subject' => 'Your Certificate',
                'email_body' => 'Dear {nama}, here is your certificate.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('projects', [
            'name' => 'Test Project',
            'template_id' => $template->id,
            'certificate_prefix' => 'psdp',
            'certificate_next_number' => 1,
            'status' => 'draft',
        ]);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAs($this->admin)
            ->post(route('projects.store'), [])
            ->assertSessionHasErrors(['name', 'template_id', 'certificate_prefix', 'certificate_digit_count']);
    }

    public function test_store_validates_digit_count(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->post(route('projects.store'), [
                'name' => 'Test',
                'template_id' => $template->id,
                'certificate_prefix' => 'psdp',
                'certificate_digit_count' => 5,
            ])
            ->assertSessionHasErrors(['certificate_digit_count']);
    }

    public function test_show_displays_project_with_relations(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->count(2)->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        Recipient::factory()->count(3)->create(['project_id' => $project->id]);

        $this->actingAs($this->admin)
            ->get(route('projects.show', $project))
            ->assertInertia(fn ($page) => $page
                ->component('Projects/Show')
                ->has('project')
                ->has('recipients.data', 3)
            );
    }

    public function test_edit_returns_form_with_template(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin)
            ->get(route('projects.edit', $project))
            ->assertInertia(fn ($page) => $page
                ->component('Projects/Edit')
                ->has('project')
                ->has('templates')
            );
    }

    public function test_update_modifies_project(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'name' => 'Original',
        ]);

        $this->actingAs($this->admin)
            ->put(route('projects.update', $project), [
                'name' => 'Updated Project',
                'template_id' => $template->id,
                'certificate_prefix' => 'new',
                'certificate_digit_count' => 4,
                'title_text' => 'Updated Title',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'name' => 'Updated Project',
            'certificate_prefix' => 'new',
        ]);
    }

    public function test_destroy_deletes_project_without_generated_certificates(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin)
            ->delete(route('projects.destroy', $project))
            ->assertRedirect();

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_destroy_fails_when_project_has_generated_certificates(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        Recipient::factory()->generated()->create(['project_id' => $project->id]);

        $this->actingAs($this->admin)
            ->delete(route('projects.destroy', $project))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }

    public function test_logo_store_uploads_logo(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $element = TemplateElement::factory()->logo()->create(['template_id' => $template->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        $file = UploadedFile::fake()->image('logo.png', 200, 200);

        $this->actingAs($this->admin)
            ->post(route('projects.logos.store', $project), [
                'logo' => $file,
                'template_element_id' => $element->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('project_logos', [
            'project_id' => $project->id,
            'template_element_id' => $element->id,
        ]);
    }

    public function test_signature_store_uploads_signature(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $element = TemplateElement::factory()->signature()->create(['template_id' => $template->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        $file = UploadedFile::fake()->image('sig.png', 200, 60);

        $this->actingAs($this->admin)
            ->post(route('projects.signatures.store', $project), [
                'signature' => $file,
                'template_element_id' => $element->id,
                'signer_name' => 'Dr. John',
                'signer_title' => 'Director',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('project_signatures', [
            'project_id' => $project->id,
            'template_element_id' => $element->id,
            'signer_name' => 'Dr. John',
        ]);
    }

    public function test_prevents_duplicate_logo_assignment(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $element = TemplateElement::factory()->logo()->create(['template_id' => $template->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        $file = UploadedFile::fake()->image('logo.png', 200, 200);
        $project->logos()->create(['template_element_id' => $element->id, 'logo_image' => 'old.png']);

        $this->actingAs($this->admin)
            ->post(route('projects.logos.store', $project), [
                'logo' => $file,
                'template_element_id' => $element->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_training_material_store_creates_material(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin)
            ->post(route('projects.training-material.store', $project), [
                'title' => 'Training Course',
                'description' => 'Course description',
                'columns' => ['No', 'Topic'],
                'rows' => [['No' => '1', 'Topic' => 'Safety']],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('training_materials', [
            'project_id' => $project->id,
            'title' => 'Training Course',
        ]);
    }

    public function test_training_material_store_validates_columns(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin)
            ->post(route('projects.training-material.store', $project), [
                'title' => 'Test',
                'columns' => [],
                'rows' => [],
            ])
            ->assertSessionHasErrors(['columns']);
    }

    public function test_unauthenticated_user_cannot_access_projects(): void
    {
        $this->get(route('projects.index'))->assertRedirect(route('login'));
        $this->get(route('projects.create'))->assertRedirect(route('login'));
        $this->post(route('projects.store'), [])->assertRedirect(route('login'));
    }
}
