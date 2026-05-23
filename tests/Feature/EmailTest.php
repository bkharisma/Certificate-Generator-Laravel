<?php

namespace Tests\Feature;

use App\Jobs\SendCertificateEmailJob;
use App\Mail\CertificateGenerated;
use App\Models\Project;
use App\Models\Recipient;
use App\Models\Setting;
use App\Models\Template;
use App\Models\TemplateElement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EmailTest extends TestCase
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
        Setting::factory()->orgName()->create();
    }

    public function test_send_email_job_dispatches_mailable(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'email_subject' => 'Your Certificate from {nama_project}',
            'email_body' => 'Dear {nama}, your certificate {nomor_sertifikat} is ready.',
        ]);

        $recipient = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'name' => 'John Doe',
            'certificate_number' => 'test/001',
        ]);

        Storage::disk('public')->put('certificates/1/test_001.pdf', 'fake-pdf');

        Mail::fake();
        Queue::fake();

        SendCertificateEmailJob::dispatch($recipient);

        Queue::assertPushed(SendCertificateEmailJob::class);
    }

    public function test_mailable_replaces_variables(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'name' => 'Safety Training',
            'email_subject' => 'Certificate - {nama_project}',
            'email_body' => 'Hello {nama}, your cert {nomor_sertifikat} from {nama_project} dated {tanggal}',
        ]);

        $recipient = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'name' => 'Alice',
            'certificate_number' => 'safety/001',
        ]);

        Storage::disk('public')->put('certificates/1/safety_001.pdf', 'fake-pdf');

        Mail::fake();

        SendCertificateEmailJob::dispatchSync($recipient);

        Mail::assertSent(CertificateGenerated::class, 1);
    }

    public function test_send_email_endpoint_queues_job(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'email_subject' => 'Test Subject',
            'email_body' => 'Test Body',
        ]);

        $recipient = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
        ]);

        Queue::fake();

        $this->actingAs($this->admin)
            ->post(route('projects.send-email', [$project, $recipient]))
            ->assertRedirect()
            ->assertSessionHas('success');

        Queue::assertPushed(SendCertificateEmailJob::class);
    }

    public function test_send_all_emails_queues_for_all_pending(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'email_subject' => 'Subject',
            'email_body' => 'Body',
        ]);

        Recipient::factory()->generated()->create(['project_id' => $project->id]);
        Recipient::factory()->generated()->create(['project_id' => $project->id]);
        Recipient::factory()->sent()->create(['project_id' => $project->id]);

        Queue::fake();

        $this->actingAs($this->admin)
            ->post(route('projects.send-all', $project))
            ->assertRedirect()
            ->assertSessionHas('success');

        Queue::assertPushed(SendCertificateEmailJob::class, 2);
    }

    public function test_send_email_fails_without_email_config(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'email_subject' => null,
            'email_body' => null,
        ]);

        $recipient = Recipient::factory()->generated()->create(['project_id' => $project->id]);

        $this->actingAs($this->admin)
            ->post(route('projects.send-email', [$project, $recipient]))
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_email_updates_status_on_success(): void
    {
        Storage::fake('public');

        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        TemplateElement::factory()->recipientName()->create(['template_id' => $template->id]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'email_subject' => 'Subject',
            'email_body' => 'Body',
        ]);

        $recipient = Recipient::factory()->generated()->create([
            'project_id' => $project->id,
            'email_status' => 'pending',
        ]);

        Storage::disk('public')->put($recipient->certificate_path, 'fake-pdf');

        Mail::fake();

        SendCertificateEmailJob::dispatchSync($recipient);

        $recipient->refresh();
        $this->assertEquals('sent', $recipient->email_status);
        $this->assertNotNull($recipient->email_sent_at);
    }
}
