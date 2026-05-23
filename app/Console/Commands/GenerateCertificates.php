<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\Recipient;
use App\Services\CertificateGenerator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GenerateCertificates extends Command
{
    protected $signature = 'certificates:generate {project_id} {--recipient= : Generate a single recipient by ID}';
    protected $description = 'Generate certificates for all pending recipients in a project';

    public function handle(CertificateGenerator $generator): int
    {
        $projectId = $this->argument('project_id');
        $project = Project::find($projectId);

        if (!$project) {
            $this->error("Project {$projectId} not found.");
            return self::FAILURE;
        }

        $recipientId = $this->option('recipient');
        if ($recipientId) {
            $recipient = Recipient::where('project_id', $project->id)->find($recipientId);
            if (!$recipient) {
                $this->error("Recipient {$recipientId} not found in project {$projectId}.");
                return self::FAILURE;
            }
            return $this->generateSingle($project, $recipient, $generator);
        }

        $recipients = $project->recipients()->where('status', 'pending')->get();

        if ($recipients->isEmpty()) {
            $this->info('No pending recipients found.');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($recipients->count());
        $bar->start();

        $generated = 0;
        $errors = 0;

        foreach ($recipients as $recipient) {
            try {
                $path = $generator->generate($project, $recipient);
                $recipient->update([
                    'certificate_path' => $path,
                    'status' => 'generated',
                ]);
                $generated++;
            } catch (\Exception $e) {
                Log::error('Certificate generation command failed', [
                    'recipient_id' => $recipient->id,
                    'error' => $e->getMessage(),
                ]);
                $errors++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $project->update(['status' => 'active']);

        $this->info("Generated {$generated} certificate(s).");
        if ($errors > 0) {
            $this->warn("{$errors} failed.");
        }

        return $errors > 0 && $generated === 0 ? self::FAILURE : self::SUCCESS;
    }

    private function generateSingle(Project $project, Recipient $recipient, CertificateGenerator $generator): int
    {
        if ($recipient->status !== 'pending') {
            $this->error("Recipient {$recipient->id} is not in pending status.");
            return self::FAILURE;
        }

        try {
            $path = $generator->generate($project, $recipient);
            $recipient->update([
                'certificate_path' => $path,
                'status' => 'generated',
            ]);
            $project->update(['status' => 'active']);
            $this->info("Certificate generated for {$recipient->name}.");
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Failed: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
