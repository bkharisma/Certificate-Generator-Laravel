<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Recipient;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RecipientControllerTest extends TestCase
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

    private function createProject(): Project
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        return Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'certificate_prefix' => 'test',
            'certificate_digit_count' => 3,
            'certificate_next_number' => 1,
        ]);
    }

    public function test_store_creates_recipient_with_auto_number(): void
    {
        $project = $this->createProject();

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.store', $project), [
                'name' => 'John Doe',
                'email' => 'john@example.com',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('recipients', [
            'project_id' => $project->id,
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'certificate_number' => 'test/001',
            'status' => 'pending',
        ]);

        $this->assertEquals(2, $project->fresh()->certificate_next_number);
    }

    public function test_store_increments_certificate_number(): void
    {
        $project = $this->createProject();
        $project->update(['certificate_next_number' => 5]);

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.store', $project), [
                'name' => 'Jane Doe',
                'email' => 'jane@example.com',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('recipients', [
            'email' => 'jane@example.com',
            'certificate_number' => 'test/005',
        ]);

        $this->assertEquals(6, $project->fresh()->certificate_next_number);
    }

    public function test_store_validates_required_fields(): void
    {
        $project = $this->createProject();

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.store', $project), [])
            ->assertSessionHasErrors(['name', 'email']);
    }

    public function test_store_validates_email_format(): void
    {
        $project = $this->createProject();

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.store', $project), [
                'name' => 'Test',
                'email' => 'not-an-email',
            ])
            ->assertSessionHasErrors(['email']);
    }

    public function test_store_prevents_duplicate_email_within_project(): void
    {
        $project = $this->createProject();

        Recipient::factory()->create([
            'project_id' => $project->id,
            'email' => 'existing@example.com',
        ]);

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.store', $project), [
                'name' => 'Dupe',
                'email' => 'existing@example.com',
            ])
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_update_modifies_recipient(): void
    {
        $project = $this->createProject();
        $recipient = Recipient::factory()->pending()->create([
            'project_id' => $project->id,
            'name' => 'Original',
        ]);

        $this->actingAs($this->admin)
            ->put(route('projects.recipients.update', [$project, $recipient]), [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('recipients', [
            'id' => $recipient->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);
    }

    public function test_update_fails_for_generated_recipient(): void
    {
        $project = $this->createProject();
        $recipient = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
        ]);

        $this->actingAs($this->admin)
            ->put(route('projects.recipients.update', [$project, $recipient]), [
                'name' => 'New Name',
                'email' => 'new@example.com',
            ])
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_destroy_deletes_pending_recipient(): void
    {
        $project = $this->createProject();
        $recipient = Recipient::factory()->pending()->create(['project_id' => $project->id]);

        $this->actingAs($this->admin)
            ->delete(route('projects.recipients.destroy', [$project, $recipient]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('recipients', ['id' => $recipient->id]);
    }

    public function test_destroy_fails_for_generated_recipient(): void
    {
        $project = $this->createProject();
        $recipient = Recipient::factory()->generated()->create(['project_id' => $project->id]);

        $this->actingAs($this->admin)
            ->delete(route('projects.recipients.destroy', [$project, $recipient]))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('recipients', ['id' => $recipient->id]);
    }

    public function test_index_returns_paginated_recipients(): void
    {
        $project = $this->createProject();
        Recipient::factory()->count(12)->create(['project_id' => $project->id]);

        $this->actingAs($this->admin)
            ->get(route('projects.recipients.index', $project))
            ->assertInertia(fn ($page) => $page
                ->component('Projects/Show')
                ->has('recipients.data', 10)
                ->has('recipients.links')
            );
    }

    public function test_download_template_returns_excel(): void
    {
        $this->actingAs($this->admin)
            ->get(route('recipients.template'))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_unauthenticated_user_cannot_access_recipients(): void
    {
        $this->post(route('projects.recipients.store', 1), [])->assertRedirect(route('login'));
    }
}
