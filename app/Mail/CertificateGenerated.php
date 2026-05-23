<?php

namespace App\Mail;

use App\Models\Project;
use App\Models\Recipient;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class CertificateGenerated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Project $project,
        public Recipient $recipient,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->project->email_subject ?? 'Certificate Generated - {nama_project}';
        $subject = $this->replaceVariables($subject);

        return new Envelope(
            to: [$this->recipient->email],
            subject: $subject,
        );
    }

    public function content(): Content
    {
        $body = $this->project->email_body ?: 'Dear {nama},<br><br>Your certificate ({nomor_sertifikat}) has been generated for {nama_project}.<br><br>You can view your digital certificate at the link below.';
        $body = $this->replaceVariables($body);

        $certUrl = Setting::get('app_url', config('app.url')) . '/cert/' . $this->recipient->certificate_number;

        return new Content(
            view: 'emails.certificate-generated',
            with: [
                'body' => $body,
                'certUrl' => $certUrl,
                'recipientName' => $this->recipient->name,
                'certificateNumber' => $this->recipient->certificate_number,
                'projectName' => $this->project->name,
                'orgName' => Setting::get('org_name', config('app.name')),
            ],
        );
    }

    public function attachments(): array
    {
        $path = $this->recipient->certificate_path;
        if (!$path || !Storage::disk('public')->exists($path)) {
            return [];
        }

        return [
            Attachment::fromStorageDisk('public', $path)
                ->as($this->recipient->certificate_number . '.pdf')
                ->withMime('application/pdf'),
        ];
    }

    protected function replaceVariables(string $text): string
    {
        $replacements = [
            '{nama}' => $this->recipient->name,
            '{nomor_sertifikat}' => $this->recipient->certificate_number,
            '{tanggal}' => $this->project->certificate_date?->format('d/m/Y') ?? now()->format('d/m/Y'),
            '{nama_project}' => $this->project->name,
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $text);
    }
}
