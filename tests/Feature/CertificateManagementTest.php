<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Recipient;
use App\Models\Setting;
use App\Models\Template;
use App\Models\TemplateElement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CertificateManagementTest extends TestCase
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

        Setting::factory()->appUrl()->create();
    }

    private function createProjectWithRecipients(): array
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'certificate_prefix' => 'cert',
            'certificate_digit_count' => 3,
            'certificate_next_number' => 1,
        ]);

        $recipient = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'name' => 'Test User',
            'certificate_number' => 'cert/001',
        ]);

        return [$project, $recipient];
    }

    public function test_certificate_index_returns_page(): void
    {
        Storage::fake('public');
        [$project, $recipient] = $this->createProjectWithRecipients();

        $this->actingAs($this->admin)
            ->get(route('certificates.index'))
            ->assertInertia(fn ($page) => $page
                ->component('Certificates/Index')
                ->has('certificates')
                ->has('projects')
                ->has('filters')
            );
    }

    public function test_certificate_index_filters_by_status(): void
    {
        [$project, $recipient1] = $this->createProjectWithRecipients();
        $recipient2 = Recipient::factory()->sent()->create([
            'project_id' => $project->id,
            'name' => 'Sent User',
            'certificate_number' => 'cert/002',
        ]);

        $this->actingAs($this->admin)
            ->get(route('certificates.index', ['status' => 'generated']))
            ->assertInertia(fn ($page) => $page
                ->component('Certificates/Index')
                ->has('certificates.data', 1)
                ->where('certificates.data.0.name', 'Test User')
            );
    }

    public function test_certificate_index_searches_by_name(): void
    {
        [$project, $recipient1] = $this->createProjectWithRecipients();
        $recipient2 = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'name' => 'Alice Wonderland',
            'certificate_number' => 'cert/002',
        ]);

        $this->actingAs($this->admin)
            ->get(route('certificates.index', ['search' => 'Alice']))
            ->assertInertia(fn ($page) => $page
                ->component('Certificates/Index')
                ->has('certificates.data', 1)
            );
    }

    public function test_certificate_index_searches_by_certificate_number(): void
    {
        [$project, $recipient1] = $this->createProjectWithRecipients();

        $this->actingAs($this->admin)
            ->get(route('certificates.index', ['search' => 'cert/001']))
            ->assertInertia(fn ($page) => $page
                ->component('Certificates/Index')
                ->has('certificates.data', 1)
            );
    }

    public function test_certificate_index_sorts_by_name(): void
    {
        [$project, $recipient1] = $this->createProjectWithRecipients();
        $recipient2 = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'name' => 'Aaron',
            'certificate_number' => 'cert/002',
        ]);

        $this->actingAs($this->admin)
            ->get(route('certificates.index', ['sort' => 'name', 'dir' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->component('Certificates/Index')
                ->where('certificates.data.0.name', 'Aaron')
            );
    }

    public function test_certificate_detail_shows_info(): void
    {
        Storage::fake('public');
        [$project, $recipient] = $this->createProjectWithRecipients();
        $recipient->update([
            'status' => 'generated',
            'certificate_path' => 'certificates/1/cert_001.pdf',
        ]);
        Storage::disk('public')->put('certificates/1/cert_001.pdf', 'fake-pdf-content');

        $this->actingAs($this->admin)
            ->get(route('certificates.show', $recipient))
            ->assertInertia(fn ($page) => $page
                ->component('Certificates/Show')
                ->has('certificate')
                ->where('certificate.name', 'Test User')
                ->where('certificate.certificate_number', 'cert/001')
            );
    }

    public function test_certificate_detail_404_for_pending(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);
        $pendingRecipient = Recipient::factory()->pending()->create([
            'project_id' => $project->id,
        ]);

        $this->actingAs($this->admin)
            ->get(route('certificates.show', $pendingRecipient))
            ->assertStatus(404);
    }

    public function test_revoke_updates_status(): void
    {
        [$project, $recipient] = $this->createProjectWithRecipients();

        $this->actingAs($this->admin)
            ->post(route('certificates.revoke', $recipient), [
                'reason' => 'Issued with incorrect name',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $recipient->refresh();
        $this->assertEquals('revoked', $recipient->status);
        $this->assertNotNull($recipient->revoked_at);
        $this->assertEquals('Issued with incorrect name', $recipient->revoke_reason);
    }

    public function test_revoke_validates_reason(): void
    {
        [$project, $recipient] = $this->createProjectWithRecipients();

        $this->actingAs($this->admin)
            ->post(route('certificates.revoke', $recipient), ['reason' => ''])
            ->assertSessionHasErrors(['reason']);
    }

    public function test_revoke_fails_for_pending(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);
        $pendingRecipient = Recipient::factory()->pending()->create([
            'project_id' => $project->id,
        ]);

        $this->actingAs($this->admin)
            ->post(route('certificates.revoke', $pendingRecipient), ['reason' => 'test'])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertEquals('pending', $pendingRecipient->fresh()->status);
    }

    public function test_regenerate_creates_new_pdf(): void
    {
        Storage::fake('public');

        [$project, $recipient] = $this->createProjectWithRecipients();
        $recipient->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revoke_reason' => 'Error',
            'certificate_path' => 'certificates/1/cert_001.pdf',
        ]);
        Storage::disk('public')->put('certificates/1/cert_001.pdf', 'old-content');

        $this->actingAs($this->admin)
            ->post(route('certificates.regenerate', $recipient))
            ->assertRedirect()
            ->assertSessionHas('success');

        $recipient->refresh();
        $this->assertEquals('generated', $recipient->status);
        $this->assertNull($recipient->revoked_at);
        $this->assertNull($recipient->revoke_reason);
        $this->assertNotNull($recipient->certificate_path);
    }

    public function test_public_certificate_show_returns_viewer(): void
    {
        Storage::fake('public');
        [$project, $recipient] = $this->createProjectWithRecipients();
        $recipient->update(['status' => 'generated', 'certificate_path' => 'certificates/1/cert_001.pdf']);
        Storage::disk('public')->put('certificates/1/cert_001.pdf', 'content');

        $this->get(route('cert.show', $recipient->certificate_number))
            ->assertInertia(fn ($page) => $page->component('Public/CertificateViewer'));
    }

    public function test_public_certificate_show_returns_revoked(): void
    {
        [$project, $recipient] = $this->createProjectWithRecipients();
        $recipient->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revoke_reason' => 'Test revocation',
        ]);

        $this->get(route('cert.show', $recipient->certificate_number))
            ->assertInertia(fn ($page) => $page->component('Public/CertificateRevoked'));
    }

    public function test_public_certificate_404_for_nonexistent(): void
    {
        $this->get(route('cert.show', 'nonexistent/999'))->assertStatus(404);
    }

    public function test_public_certificate_404_for_pending(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
        ]);
        $pendingRecipient = Recipient::factory()->pending()->create([
            'project_id' => $project->id,
            'certificate_number' => 'pending/001',
        ]);

        $this->get(route('cert.show', $pendingRecipient->certificate_number))->assertStatus(404);
    }
}
