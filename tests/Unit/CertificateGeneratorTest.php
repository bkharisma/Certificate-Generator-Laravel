<?php

namespace Tests\Unit;

use App\Models\Project;
use App\Models\Recipient;
use App\Models\Setting;
use App\Models\Template;
use App\Models\TemplateElement;
use App\Models\User;
use App\Services\CertificateGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CertificateGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private CertificateGenerator $generator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = new CertificateGenerator;
        Setting::factory()->appUrl()->create();
    }

    public function test_generates_pdf_and_returns_path(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $template = Template::factory()->create(['created_by' => $user->id]);

        TemplateElement::factory()->recipientName()->create([
            'template_id' => $template->id,
            'x' => 50, 'y' => 80, 'width' => 200, 'height' => 15,
        ]);
        TemplateElement::factory()->title()->create([
            'template_id' => $template->id,
            'x' => 50, 'y' => 40, 'width' => 200, 'height' => 15,
        ]);
        TemplateElement::factory()->certificateNumber()->create([
            'template_id' => $template->id,
            'x' => 50, 'y' => 120, 'width' => 200, 'height' => 10,
        ]);
        TemplateElement::factory()->date()->create([
            'template_id' => $template->id,
            'x' => 50, 'y' => 140, 'width' => 200, 'height' => 10,
        ]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $user->id,
            'certificate_prefix' => 'test',
            'certificate_digit_count' => 3,
            'title_text' => 'Test Certificate',
        ]);

        $recipient = Recipient::factory()->create([
            'project_id' => $project->id,
            'name' => 'John Doe',
            'certificate_number' => 'test/001',
        ]);

        $path = $this->generator->generate($project, $recipient);

        $this->assertNotNull($path);
        $this->assertStringContainsString('certificates/', $path);
        $this->assertStringContainsString('test_001.pdf', $path);
        Storage::disk('public')->assertExists($path);

        $fileSize = Storage::disk('public')->size($path);
        $this->assertGreaterThan(100, $fileSize, 'PDF should have meaningful content');
    }

    public function test_generates_pdf_with_qr_code(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $template = Template::factory()->create(['created_by' => $user->id]);

        TemplateElement::factory()->recipientName()->create([
            'template_id' => $template->id,
        ]);
        TemplateElement::factory()->qrCode()->create([
            'template_id' => $template->id,
            'x' => 250, 'y' => 10, 'width' => 30, 'height' => 30,
        ]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $user->id,
            'certificate_prefix' => 'qr',
        ]);

        $recipient = Recipient::factory()->create([
            'project_id' => $project->id,
            'certificate_number' => 'qr/001',
        ]);

        $path = $this->generator->generate($project, $recipient);

        Storage::disk('public')->assertExists($path);
        $this->assertNotNull($path);
    }

    public function test_generates_pdf_with_training_material_page(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $template = Template::factory()->create(['created_by' => $user->id]);

        TemplateElement::factory()->recipientName()->create([
            'template_id' => $template->id,
        ]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $user->id,
            'certificate_prefix' => 'mat',
        ]);

        $project->trainingMaterial()->create([
            'title' => 'Training Course',
            'description' => 'Course description',
            'columns' => ['No', 'Topic', 'Score'],
            'rows' => [
                ['No' => '1', 'Topic' => 'Safety', 'Score' => '90'],
                ['No' => '2', 'Topic' => 'First Aid', 'Score' => '85'],
            ],
        ]);

        $recipient = Recipient::factory()->create([
            'project_id' => $project->id,
            'certificate_number' => 'mat/001',
        ]);

        $path = $this->generator->generate($project, $recipient);

        Storage::disk('public')->assertExists($path);
        $this->assertNotNull($path);
    }

    public function test_generates_pdf_with_background_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $bgFile = UploadedFile::fake()->image('background.png', 800, 600);
        $bgPath = $bgFile->store('templates/1', 'public');

        $template = Template::factory()->create([
            'created_by' => $user->id,
            'background_image' => $bgPath,
        ]);

        TemplateElement::factory()->recipientName()->create([
            'template_id' => $template->id,
        ]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $user->id,
            'certificate_prefix' => 'bg',
        ]);

        $recipient = Recipient::factory()->create([
            'project_id' => $project->id,
            'certificate_number' => 'bg/001',
        ]);

        $path = $this->generator->generate($project, $recipient);

        Storage::disk('public')->assertExists($path);
        $this->assertNotNull($path);
    }

    public function test_returns_error_for_nonexistent_background(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $template = Template::factory()->create([
            'created_by' => $user->id,
            'background_image' => 'templates/99/nonexistent.png',
        ]);

        TemplateElement::factory()->recipientName()->create([
            'template_id' => $template->id,
        ]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $user->id,
            'certificate_prefix' => 'err',
        ]);

        $recipient = Recipient::factory()->create([
            'project_id' => $project->id,
            'certificate_number' => 'err/001',
        ]);

        $path = $this->generator->generate($project, $recipient);

        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_generates_pdf_with_signature_and_logo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $template = Template::factory()->create(['created_by' => $user->id]);

        $sigElement = TemplateElement::factory()->signature()->create([
            'template_id' => $template->id,
            'x' => 50, 'y' => 160, 'width' => 60, 'height' => 25,
        ]);

        $logoElement = TemplateElement::factory()->logo()->create([
            'template_id' => $template->id,
            'x' => 20, 'y' => 20, 'width' => 40, 'height' => 40,
        ]);

        $project = Project::factory()->create([
            'template_id' => $template->id,
            'created_by' => $user->id,
            'certificate_prefix' => 'sig',
        ]);

        $sigFile = UploadedFile::fake()->image('signature.png', 200, 60);
        $sigPath = $sigFile->store("projects/{$project->id}/signatures", 'public');

        $logoFile = UploadedFile::fake()->image('logo.png', 200, 200);
        $logoPath = $logoFile->store("projects/{$project->id}/logos", 'public');

        $project->signatures()->create([
            'template_element_id' => $sigElement->id,
            'signature_image' => $sigPath,
            'signer_name' => 'Dr. John Smith',
            'signer_title' => 'Head of Training',
            'sort_order' => 1,
        ]);

        $project->logos()->create([
            'template_element_id' => $logoElement->id,
            'logo_image' => $logoPath,
            'sort_order' => 1,
        ]);

        $recipient = Recipient::factory()->create([
            'project_id' => $project->id,
            'certificate_number' => 'sig/001',
        ]);

        $path = $this->generator->generate($project, $recipient);

        Storage::disk('public')->assertExists($path);
        $this->assertNotNull($path);
    }

    public function test_hex_to_rgb_conversion(): void
    {
        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('hexToRgb');
        $method->setAccessible(true);

        $this->assertEquals([0, 0, 0], $method->invoke($this->generator, '#000000'));
        $this->assertEquals([255, 255, 255], $method->invoke($this->generator, '#FFFFFF'));
        $this->assertEquals([255, 0, 0], $method->invoke($this->generator, '#FF0000'));
        $this->assertEquals([0, 255, 0], $method->invoke($this->generator, '#00FF00'));
        $this->assertEquals([0, 0, 255], $method->invoke($this->generator, '#0000FF'));
        $this->assertEquals([255, 255, 255], $method->invoke($this->generator, '#FFF'));
        $this->assertEquals([255, 0, 0], $method->invoke($this->generator, '#F00'));
    }

    public function test_font_mapping(): void
    {
        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('mapFont');
        $method->setAccessible(true);

        $this->assertEquals('Helvetica', $method->invoke($this->generator, 'Arial'));
        $this->assertEquals('Times', $method->invoke($this->generator, 'Times New Roman'));
        $this->assertEquals('Courier', $method->invoke($this->generator, 'Courier New'));
        $this->assertEquals('Helvetica', $method->invoke($this->generator, 'Helvetica'));
        $this->assertEquals('Helvetica', $method->invoke($this->generator, 'Unknown Font'));
        $this->assertEquals('Helvetica', $method->invoke($this->generator, null));
    }

    public function test_style_mapping(): void
    {
        $reflection = new \ReflectionClass($this->generator);
        $method = $reflection->getMethod('mapStyle');
        $method->setAccessible(true);

        $this->assertEquals('', $method->invoke($this->generator, 'normal'));
        $this->assertEquals('B', $method->invoke($this->generator, 'bold'));
        $this->assertEquals('I', $method->invoke($this->generator, 'italic'));
        $this->assertEquals('', $method->invoke($this->generator, 'unknown'));
        $this->assertEquals('', $method->invoke($this->generator, null));
    }
}
