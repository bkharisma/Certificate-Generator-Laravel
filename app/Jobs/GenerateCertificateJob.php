<?php

namespace App\Jobs;

use App\Models\Project;
use App\Models\Recipient;
use App\Services\CertificateGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateCertificateJob implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Project $project,
        public Recipient $recipient,
    ) {}

    public function handle(CertificateGenerator $generator): void
    {
        try {
            $path = $generator->generate($this->project, $this->recipient);
            $this->recipient->update([
                'certificate_path' => $path,
                'status' => 'generated',
            ]);
        } catch (\Exception $e) {
            Log::error('GenerateCertificateJob failed', [
                'recipient_id' => $this->recipient->id,
                'project_id' => $this->project->id,
                'error' => $e->getMessage(),
            ]);
            $this->fail($e);
        }
    }
}
