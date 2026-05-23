<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectLogoRequest;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\StoreProjectSignatureRequest;
use App\Http\Requests\StoreTrainingMaterialRequest;
use App\Http\Requests\UpdateProjectLogoRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Requests\UpdateProjectSignatureRequest;
use App\Models\Project;
use App\Models\ProjectLogo;
use App\Models\ProjectSignature;
use App\Models\Recipient;
use App\Models\TrainingMaterial;
use App\Models\Template;
use App\Jobs\SendCertificateEmailJob;
use App\Services\CertificateGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use ZipArchive;

class ProjectController extends Controller
{
    private function authorizeProject(Project $project): void
    {
        if (!request()->user()->isAdmin() && $project->created_by !== request()->user()->id) {
            abort(403);
        }
    }

    public function index(): Response
    {
        $projects = Project::with('template:id,name', 'creator:id,name')
            ->withCount('recipients')
            ->when(!request()->user()->isAdmin(), fn ($q) => $q->where('created_by', request()->user()->id))
            ->latest()
            ->paginate(15);

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function create(): Response
    {
        $templates = Template::select('id', 'name', 'page_width', 'page_height', 'orientation')
            ->with('elements')
            ->when(!request()->user()->isAdmin(), fn ($q) => $q->where('created_by', request()->user()->id))
            ->latest()
            ->get();

        return Inertia::render('Projects/Create', [
            'templates' => $templates,
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = Project::create([
            'name' => $request->name,
            'template_id' => $request->template_id,
            'title_text' => $request->title_text,
            'certificate_date' => $request->certificate_date ?? now()->toDateString(),
            'certificate_prefix' => $request->certificate_prefix,
            'certificate_digit_count' => $request->certificate_digit_count,
            'certificate_next_number' => 1,
            'email_subject' => $request->email_subject,
            'email_body' => $request->email_body,
            'status' => 'draft',
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project created successfully.');
    }

    public function show(Project $project): Response
    {
        $this->authorizeProject($project);

        $project->load([
            'template:id,name,page_width,page_height,orientation,background_image',
            'template.elements',
            'creator:id,name',
            'signatures' => fn ($q) => $q->with('templateElement'),
            'logos' => fn ($q) => $q->with('templateElement'),
            'trainingMaterial',
        ]);

        $project->loadCount('recipients');

        $recipients = $project->recipients()
            ->latest()
            ->paginate(10);

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'recipients' => $recipients,
        ]);
    }

    public function edit(Project $project): Response
    {
        $this->authorizeProject($project);

        $templates = Template::select('id', 'name', 'page_width', 'page_height', 'orientation')
            ->when(!request()->user()->isAdmin(), fn ($q) => $q->where('created_by', request()->user()->id))
            ->latest()
            ->get();

        $project->load('template:id,name,page_width,page_height,orientation');

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'templates' => $templates,
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        $project->update($request->validated());

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($project->recipients()->where('status', 'generated')->exists()) {
            return redirect()->route('projects.index')
                ->with('error', 'Cannot delete project that has generated certificates.');
        }

        foreach ($project->signatures as $signature) {
            Storage::disk('public')->delete($signature->signature_image);
        }
        $project->signatures()->delete();

        foreach ($project->logos as $logo) {
            Storage::disk('public')->delete($logo->logo_image);
        }
        $project->logos()->delete();

        foreach ($project->recipients as $recipient) {
            if ($recipient->certificate_path) {
                Storage::disk('local')->delete($recipient->certificate_path);
            }
        }
        $project->recipients()->delete();

        if ($project->trainingMaterial) {
            if ($project->trainingMaterial->background_image) {
                Storage::disk('public')->delete($project->trainingMaterial->background_image);
            }
            $project->trainingMaterial->delete();
        }
        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted successfully.');
    }

    public function storeLogo(StoreProjectLogoRequest $request, Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($project->logos()->where('template_element_id', $request->template_element_id)->exists()) {
            return redirect()->back()->with('error', 'A logo is already assigned to this area.');
        }

        $path = $request->file('logo')->store("projects/{$project->id}/logos", 'public');

        $project->logos()->create([
            'template_element_id' => $request->template_element_id,
            'logo_image' => $path,
            'sort_order' => $request->sort_order ?? 1,
        ]);

        return redirect()->back()->with('success', 'Logo uploaded successfully.');
    }

    public function updateLogo(UpdateProjectLogoRequest $request, Project $project, ProjectLogo $logo): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($logo->project_id !== $project->id) {
            abort(404);
        }

        if ($request->hasFile('logo')) {
            Storage::disk('public')->delete($logo->logo_image);

            $path = $request->file('logo')->store("projects/{$project->id}/logos", 'public');
            $logo->update(['logo_image' => $path]);
        }

        return redirect()->back()->with('success', 'Logo updated successfully.');
    }

    public function destroyLogo(Project $project, ProjectLogo $logo): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($logo->project_id !== $project->id) {
            abort(404);
        }

        Storage::disk('public')->delete($logo->logo_image);
        $logo->delete();

        return redirect()->back()->with('success', 'Logo removed successfully.');
    }

    public function storeSignature(StoreProjectSignatureRequest $request, Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($project->signatures()->where('template_element_id', $request->template_element_id)->exists()) {
            return redirect()->back()->with('error', 'A signature is already assigned to this area.');
        }

        $path = $request->file('signature')->store("projects/{$project->id}/signatures", 'public');

        $project->signatures()->create([
            'template_element_id' => $request->template_element_id,
            'signature_image' => $path,
            'signer_name' => $request->signer_name,
            'signer_title' => $request->signer_title,
            'sort_order' => $request->sort_order ?? 1,
        ]);

        return redirect()->back()->with('success', 'Signature assigned successfully.');
    }

    public function updateSignature(UpdateProjectSignatureRequest $request, Project $project, ProjectSignature $signature): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($signature->project_id !== $project->id) {
            abort(404);
        }

        if ($request->hasFile('signature')) {
            Storage::disk('public')->delete($signature->signature_image);

            $path = $request->file('signature')->store("projects/{$project->id}/signatures", 'public');
            $signature->update(['signature_image' => $path]);
        }

        $signature->update($request->only(['signer_name', 'signer_title']));

        return redirect()->back()->with('success', 'Signature updated successfully.');
    }

    public function destroySignature(Project $project, ProjectSignature $signature): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($signature->project_id !== $project->id) {
            abort(404);
        }

        Storage::disk('public')->delete($signature->signature_image);
        $signature->delete();

        return redirect()->back()->with('success', 'Signature removed successfully.');
    }

    public function storeTrainingMaterial(StoreTrainingMaterialRequest $request, Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        $data = $request->validated();

        if ($request->hasFile('background_image')) {
            $path = $request->file('background_image')->store("training-materials/{$project->id}", 'public');
            $data['background_image'] = $path;
        }

        if ($project->trainingMaterial) {
            if ($request->hasFile('background_image') && $project->trainingMaterial->background_image) {
                Storage::disk('public')->delete($project->trainingMaterial->background_image);
            }
            $project->trainingMaterial->update($data);
        } else {
            $project->trainingMaterial()->create($data);
        }

        return redirect()->back()->with('success', 'Training materials saved successfully.');
    }

    public function destroyTrainingMaterial(Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($project->trainingMaterial) {
            if ($project->trainingMaterial->background_image) {
                Storage::disk('public')->delete($project->trainingMaterial->background_image);
            }
            $project->trainingMaterial->delete();
        }

        return redirect()->back()->with('success', 'Training materials removed successfully.');
    }

    public function generate(Project $project, CertificateGenerator $generator): RedirectResponse
    {
        $this->authorizeProject($project);

        $recipients = $project->recipients()->where('status', 'pending')->get();

        if ($recipients->isEmpty()) {
            return redirect()->back()->with('error', 'No pending recipients to generate certificates for.');
        }

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
                $errors++;
                \Illuminate\Support\Facades\Log::error('Certificate generation failed', [
                    'recipient_id' => $recipient->id,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }

            try {
                SendCertificateEmailJob::dispatch($recipient);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Certificate email dispatch failed', [
                    'recipient_id' => $recipient->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $project->update(['status' => 'active']);

        $message = "Generated {$generated} certificate(s).";
        if ($errors > 0) {
            $message .= " {$errors} failed.";
        }

        return redirect()->back()->with(
            $errors > 0 && $generated === 0 ? 'error' : 'success',
            $message
        );
    }

    public function preview(Project $project, CertificateGenerator $generator)
    {
        $this->authorizeProject($project);

        try {
            $path = $generator->generatePreview($project);
            $fullPath = Storage::disk('local')->path($path);
            return response()->file($fullPath);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Certificate preview failed', [
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to generate preview. Please try again.');
        }
    }

    public function generateSingle(Project $project, Recipient $recipient, CertificateGenerator $generator): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($recipient->project_id !== $project->id) {
            abort(404);
        }

        if ($recipient->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending recipients can be generated.');
        }

        try {
            $path = $generator->generate($project, $recipient);
            $recipient->update([
                'certificate_path' => $path,
                'status' => 'generated',
            ]);

            $project->update(['status' => 'active']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Certificate generation failed', [
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to generate certificate. Please try again.');
        }

        try {
            SendCertificateEmailJob::dispatch($recipient);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Certificate email dispatch failed', [
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);
        }

        return redirect()->back()->with('success', "Certificate generated for {$recipient->name}.");
    }

    public function regenerate(Project $project, Recipient $recipient, CertificateGenerator $generator): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($recipient->project_id !== $project->id) {
            abort(404);
        }

        $allowedStatuses = ['pending', 'revoked'];
        if (!in_array($recipient->status, $allowedStatuses)) {
            return redirect()->back()->with('error', 'Only pending or revoked certificates can be regenerated.');
        }

        try {
            if ($recipient->certificate_path) {
                Storage::disk('local')->delete($recipient->certificate_path);
            }

            $path = $generator->generate($project, $recipient);
            $recipient->update([
                'certificate_path' => $path,
                'status' => 'generated',
                'revoked_at' => null,
                'revoke_reason' => null,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Certificate regeneration failed', [
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to regenerate certificate. Please try again.');
        }

        try {
            SendCertificateEmailJob::dispatch($recipient);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Certificate email dispatch failed', [
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);
        }

        return redirect()->back()->with('success', "Certificate regenerated for {$recipient->name}.");
    }

    public function revokeSingle(Request $request, Project $project, Recipient $recipient): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($recipient->project_id !== $project->id) {
            abort(404);
        }

        if (!in_array($recipient->status, ['generated', 'sent'])) {
            return redirect()->back()->with('error', 'Only generated certificates can be revoked.');
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $recipient->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revoke_reason' => $request->reason,
        ]);

        return redirect()->back()->with('success', "Certificate revoked for {$recipient->name}.");
    }

    public function regenerateAll(Project $project, CertificateGenerator $generator): RedirectResponse
    {
        $this->authorizeProject($project);

        $recipients = $project->recipients()
            ->whereIn('status', ['pending', 'generated', 'sent', 'revoked'])
            ->get();

        if ($recipients->isEmpty()) {
            return redirect()->back()->with('error', 'No recipients to regenerate.');
        }

        $regenerated = 0;
        $errors = 0;

        foreach ($recipients as $recipient) {
            try {
                if ($recipient->certificate_path) {
                    Storage::disk('local')->delete($recipient->certificate_path);
                }

                $path = $generator->generate($project, $recipient);
                $recipient->update([
                    'certificate_path' => $path,
                    'status' => 'generated',
                    'revoked_at' => null,
                    'revoke_reason' => null,
                ]);

                $regenerated++;
            } catch (\Exception $e) {
                $errors++;
                \Illuminate\Support\Facades\Log::error('Certificate regeneration failed', [
                    'recipient_id' => $recipient->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $project->update(['status' => 'active']);

        $message = "Regenerated {$regenerated} certificate(s).";
        if ($errors > 0) {
            $message .= " {$errors} failed.";
        }

        return redirect()->back()->with(
            $errors > 0 && $regenerated === 0 ? 'error' : 'success',
            $message
        );
    }

    public function revokeAll(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $recipients = $project->recipients()
            ->whereIn('status', ['generated', 'sent'])
            ->get();

        if ($recipients->isEmpty()) {
            return redirect()->back()->with('error', 'No generated certificates to revoke.');
        }

        $revoked = 0;
        foreach ($recipients as $recipient) {
            $recipient->update([
                'status' => 'revoked',
                'revoked_at' => now(),
                'revoke_reason' => $request->reason,
            ]);
            $revoked++;
        }

        return redirect()->back()->with('success', "{$revoked} certificate(s) revoked.");
    }

    public function sendEmail(Project $project, Recipient $recipient): RedirectResponse
    {
        $this->authorizeProject($project);

        if ($recipient->project_id !== $project->id) {
            abort(404);
        }

        $allowedStatuses = ['generated', 'sent'];
        if (!in_array($recipient->status, $allowedStatuses)) {
            return redirect()->back()->with('error', 'Email can only be sent for generated certificates.');
        }

        if (!$project->email_subject && !$project->email_body) {
            return redirect()->back()->with('error', 'Email template is not configured. Please set email subject and body in project settings.');
        }

        try {
            SendCertificateEmailJob::dispatch($recipient);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Certificate email dispatch failed', [
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to send email. Check server logs for details.');
        }

        return redirect()->back()->with('success', "Email queued for {$recipient->name}.");
    }

    public function sendAllEmails(Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        $recipients = $project->recipients()
            ->whereIn('status', ['generated', 'sent'])
            ->where('email_status', '!=', 'sent')
            ->get();

        if ($recipients->isEmpty()) {
            return redirect()->back()->with('error', 'No recipients pending email delivery.');
        }

        if (!$project->email_subject && !$project->email_body) {
            return redirect()->back()->with('error', 'Email template is not configured. Please set email subject and body in project settings.');
        }

        $queued = 0;
        $errors = 0;
        foreach ($recipients as $recipient) {
            try {
                SendCertificateEmailJob::dispatch($recipient);
                $queued++;
            } catch (\Exception $e) {
                $errors++;
                \Illuminate\Support\Facades\Log::warning('Certificate email dispatch failed', [
                    'recipient_id' => $recipient->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $message = "{$queued} email(s) queued for delivery.";
        if ($errors > 0) {
            $message .= " {$errors} failed.";
        }

        return redirect()->back()->with($errors > 0 && $queued === 0 ? 'error' : 'success', $message);
    }

    public function downloadZip(Project $project)
    {
        $this->authorizeProject($project);

        $recipients = $project->recipients()
            ->whereIn('status', ['generated', 'sent'])
            ->get();

        if ($recipients->isEmpty()) {
            return redirect()->back()->with('error', 'No generated certificates to download.');
        }

        $zipName = str_replace(['/', ' '], '_', $project->name) . '_certificates.zip';
        $zipPath = tempnam(sys_get_temp_dir(), 'zip');
        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
            return redirect()->back()->with('error', 'Failed to create ZIP archive.');
        }

        $added = 0;
        foreach ($recipients as $recipient) {
            if ($recipient->certificate_path && Storage::disk('local')->exists($recipient->certificate_path)) {
                $fullPath = Storage::disk('local')->path($recipient->certificate_path);
                $fileName = str_replace('/', '_', $recipient->certificate_number) . '.pdf';
                $zip->addFile($fullPath, $fileName);
                $added++;
            }
        }

        $zip->close();

        if ($added === 0) {
            unlink($zipPath);
            return redirect()->back()->with('error', 'No certificate files found on disk.');
        }

        return response()->download($zipPath, $zipName)->deleteFileAfterSend(true);
    }
}
