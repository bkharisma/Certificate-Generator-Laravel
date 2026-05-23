<?php

namespace App\Jobs;

use App\Mail\CertificateGenerated;
use App\Models\Recipient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendCertificateEmailJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Recipient $recipient,
    ) {}

    public function handle(): void
    {
        try {
            $this->recipient->load('project');

            Mail::send(new CertificateGenerated($this->recipient->project, $this->recipient));

            $this->recipient->update([
                'email_status' => 'sent',
                'email_sent_at' => now(),
            ]);

            Log::info('Certificate email sent successfully', [
                'recipient_id' => $this->recipient->id,
                'certificate_number' => $this->recipient->certificate_number,
            ]);
        } catch (\Exception $e) {
            $this->recipient->update([
                'email_status' => 'failed',
            ]);

            Log::error('SendCertificateEmailJob failed', [
                'recipient_id' => $this->recipient->id,
                'project_id' => $this->recipient->project_id,
                'error' => $e->getMessage(),
            ]);

            $this->fail($e);
        }
    }
}
