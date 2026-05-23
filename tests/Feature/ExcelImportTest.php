<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ExcelImportTest extends TestCase
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
            'certificate_prefix' => 'import',
            'certificate_digit_count' => 3,
            'certificate_next_number' => 1,
        ]);
    }

    public function test_import_creates_recipients_from_excel(): void
    {
        $project = $this->createProject();

        $header = 'name,email';
        $row1 = 'John Doe,john@example.com';
        $row2 = 'Jane Doe,jane@example.com';
        $content = implode("\n", [$header, $row1, $row2]);

        $file = UploadedFile::fake()->createWithContent('recipients.csv', $content);

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.import', $project), [
                'file' => $file,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('recipients', [
            'project_id' => $project->id,
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'certificate_number' => 'import/001',
        ]);

        $this->assertDatabaseHas('recipients', [
            'project_id' => $project->id,
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'certificate_number' => 'import/002',
        ]);
    }

    public function test_import_auto_increments_certificate_numbers(): void
    {
        $project = $this->createProject();
        $project->update(['certificate_next_number' => 10]);

        $header = 'name,email';
        $rows = "Alice,alice@example.com\nBob,bob@example.com\nCharlie,charlie@example.com";
        $file = UploadedFile::fake()->createWithContent('recipients.csv', implode("\n", [$header, $rows]));

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.import', $project), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseHas('recipients', ['certificate_number' => 'import/010']);
        $this->assertDatabaseHas('recipients', ['certificate_number' => 'import/011']);
        $this->assertDatabaseHas('recipients', ['certificate_number' => 'import/012']);

        $this->assertEquals(13, $project->fresh()->certificate_next_number);
    }

    public function test_import_skips_duplicate_emails(): void
    {
        $project = $this->createProject();

        $project->recipients()->create([
            'name' => 'Existing',
            'email' => 'existing@example.com',
            'certificate_number' => 'import/001',
            'status' => 'pending',
            'email_status' => 'pending',
        ]);
        $project->increment('certificate_next_number');

        $header = 'name,email';
        $rows = "New User,existing@example.com\nAnother,new@example.com";
        $file = UploadedFile::fake()->createWithContent('recipients.csv', implode("\n", [$header, $rows]));

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.import', $project), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseHas('recipients', ['email' => 'new@example.com']);
        $this->assertDatabaseMissing('recipients', [
            'email' => 'existing@example.com',
            'name' => 'New User',
        ]);

        $this->assertEquals(3, $project->fresh()->certificate_next_number);
    }

    public function test_import_validates_required_fields(): void
    {
        $project = $this->createProject();

        $header = 'name,email';
        $rows = ",invalid-email";
        $file = UploadedFile::fake()->createWithContent('recipients.csv', implode("\n", [$header, $rows]));

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.import', $project), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseCount('recipients', 0);
    }

    public function test_import_rejects_invalid_file_type(): void
    {
        $project = $this->createProject();

        $file = UploadedFile::fake()->create('document.pdf', 100);

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.import', $project), ['file' => $file])
            ->assertSessionHasErrors(['file']);
    }

    public function test_import_rejects_oversized_file(): void
    {
        $project = $this->createProject();

        $file = UploadedFile::fake()->create('recipients.xlsx', 6000);

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.import', $project), ['file' => $file])
            ->assertSessionHasErrors(['file']);
    }

    public function test_download_template_returns_excel_file(): void
    {
        $this->actingAs($this->admin)
            ->get(route('recipients.template'))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_import_with_four_digit_numbers(): void
    {
        $template = Template::factory()->create(['created_by' => $this->admin->id]);
        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $this->admin->id,
            'certificate_prefix' => 'cert',
            'certificate_digit_count' => 4,
            'certificate_next_number' => 1,
        ]);

        $file = UploadedFile::fake()->createWithContent('recipients.csv', "name,email\nTest,test@example.com");

        $this->actingAs($this->admin)
            ->post(route('projects.recipients.import', $project), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseHas('recipients', ['certificate_number' => 'cert/0001']);
    }
}
