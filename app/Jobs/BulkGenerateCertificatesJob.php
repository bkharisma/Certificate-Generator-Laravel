<?php

namespace App\Jobs;

use App\Models\Project;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BulkGenerateCertificatesJob implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Project $project,
    ) {}

    public function handle(): void
    {
        $recipients = $this->project->recipients()->where('status', 'pending')->get();

        foreach ($recipients as $recipient) {
            GenerateCertificateJob::dispatch($this->project, $recipient);
        }

        $this->project->update(['status' => 'active']);
    }
}
