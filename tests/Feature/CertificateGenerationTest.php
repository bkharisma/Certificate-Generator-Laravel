<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Recipient;
use App\Models\Setting;
use App\Models\Template;
use App\Models\TemplateElement;
use App\Models\User;
use App\Services\CertificateGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CertificateGenerationTest extends TestCase
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

    private function setupProjectWithPendingRecipients(int $count = 3): array
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'certificate_prefix' => 'gen',
            'certificate_digit_count' => 3,
            'certificate_next_number' => 1,
        ]);

        $recipients = [];
        for ($i = 1; $i <= $count; $i++) {
            $recipients[] = Recipient::factory()->pending()->create([
                'project_id' => $project->id,
                'name' => "User {$i}",
                'certificate_number' => "gen/" . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
            ]);
        }

        return [$project, $recipients];
    }

    public function test_bulk_generate_creates_pdfs_for_all_pending(): void
    {
        [$project, $recipients] = $this->setupProjectWithPendingRecipients(3);

        $this->actingAs($this->admin)
            ->post(route('projects.generate', $project))
            ->assertRedirect()
            ->assertSessionHas('success');

        foreach ($recipients as $recipient) {
            $recipient->refresh();
            $this->assertEquals('generated', $recipient->status);
            $this->assertNotNull($recipient->certificate_path);
            Storage::disk('public')->assertExists($recipient->certificate_path);
        }

        $this->assertEquals('active', $project->fresh()->status);
    }

    public function test_bulk_generate_skips_already_generated(): void
    {
        [$project, $recipients] = $this->setupProjectWithPendingRecipients(2);
        $recipients[0]->update(['status' => 'generated', 'certificate_path' => 'old/path.pdf']);

        $this->actingAs($this->admin)
            ->post(route('projects.generate', $project))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertEquals('generated', $recipients[0]->fresh()->status);
        $this->assertEquals('generated', $recipients[1]->fresh()->status);
    }

    public function test_bulk_generate_errors_when_no_pending(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'certificate_prefix' => 'gen',
        ]);

        $this->actingAs($this->admin)
            ->post(route('projects.generate', $project))
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_single_generate_creates_pdf(): void
    {
        [$project, $recipients] = $this->setupProjectWithPendingRecipients(1);
        $recipient = $recipients[0];

        $this->actingAs($this->admin)
            ->post(route('projects.generate.single', [$project, $recipient]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $recipient->refresh();
        $this->assertEquals('generated', $recipient->status);
        $this->assertNotNull($recipient->certificate_path);
        Storage::disk('public')->assertExists($recipient->certificate_path);

        $this->assertEquals('active', $project->fresh()->status);
    }

    public function test_single_generate_fails_for_non_pending(): void
    {
        [$project, $recipients] = $this->setupProjectWithPendingRecipients(1);
        $recipient = $recipients[0];
        $recipient->update(['status' => 'generated']);

        $this->actingAs($this->admin)
            ->post(route('projects.generate.single', [$project, $recipient]))
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_regenerate_replaces_old_pdf(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'certificate_prefix' => 'reg',
            'certificate_digit_count' => 3,
        ]);

        $recipient = Recipient::factory()->revoked()->create([
            'project_id' => $project->id,
            'name' => 'Regen User',
            'certificate_number' => 'reg/001',
        ]);
        Storage::disk('public')->put($recipient->certificate_path, 'old-content');

        $this->actingAs($this->admin)
            ->post(route('projects.regenerate', [$project, $recipient]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $recipient->refresh();
        $this->assertEquals('generated', $recipient->status);
        $this->assertNull($recipient->revoked_at);
        $this->assertNull($recipient->revoke_reason);
        $this->assertNotNull($recipient->certificate_path);
    }

    public function test_download_zip_contains_pdfs(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'certificate_prefix' => 'zip',
            'certificate_digit_count' => 3,
            'certificate_next_number' => 1,
        ]);

        $r1 = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'certificate_number' => 'zip/001',
        ]);
        $r2 = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'certificate_number' => 'zip/002',
        ]);

        Storage::disk('public')->put($r1->certificate_path, 'pdf-1-content');
        Storage::disk('public')->put($r2->certificate_path, 'pdf-2-content');

        $this->actingAs($this->admin)
            ->get(route('projects.download-zip', $project))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/zip');
    }

    public function test_download_zip_errors_when_no_generated(): void
    {
        Storage::fake('public');
        [$project, $recipients] = $this->setupProjectWithPendingRecipients(1);

        $this->actingAs($this->admin)
            ->get(route('projects.download-zip', $project))
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_regenerate_fails_for_generated_status(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'certificate_prefix' => 'reg',
        ]);

        $recipient = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'certificate_number' => 'reg/001',
        ]);

        $this->actingAs($this->admin)
            ->post(route('projects.regenerate', [$project, $recipient]))
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_artisan_command_generates_certificates(): void
    {
        Storage::fake('public');
        [$project, $recipients] = $this->setupProjectWithPendingRecipients(2);

        $this->artisan('certificates:generate', ['project_id' => $project->id])
            ->assertSuccessful();

        foreach ($recipients as $recipient) {
            $recipient->refresh();
            $this->assertEquals('generated', $recipient->status);
        }
    }

    public function test_artisan_command_with_recipient_option(): void
    {
        Storage::fake('public');
        [$project, $recipients] = $this->setupProjectWithPendingRecipients(3);

        $this->artisan('certificates:generate', [
            'project_id' => $project->id,
            '--recipient' => $recipients[0]->id,
        ])->assertSuccessful();

        $this->assertEquals('generated', $recipients[0]->fresh()->status);
        $this->assertEquals('pending', $recipients[1]->fresh()->status);
    }
}
