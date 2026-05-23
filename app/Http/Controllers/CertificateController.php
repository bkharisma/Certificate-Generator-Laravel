<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Recipient;
use App\Models\Setting;
use App\Services\CertificateGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();

        $query = Recipient::with('project:id,name')
            ->whereIn('status', ['generated', 'sent', 'revoked'])
            ->when(!$user->isAdmin(), fn ($q) => $q->whereIn('project_id',
                Project::where('created_by', $user->id)->pluck('id')
            ));

        if ($search = request('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('certificate_number', 'like', "%{$search}%");
            });
        }

        if ($projectId = request('project')) {
            $query->where('project_id', $projectId);
        }

        if ($status = request('status')) {
            $query->where('status', $status);
        }

        if ($emailStatus = request('email_status')) {
            $query->where('email_status', $emailStatus);
        }

        $sortField = request('sort', 'created_at');
        $sortDir = request('dir', 'desc');
        $allowedSorts = ['name', 'certificate_number', 'status', 'email_status', 'created_at'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $certificates = $query->paginate(15)->withQueryString();

        $projects = Project::select('id', 'name')
            ->whereHas('recipients', fn ($q) => $q->whereIn('status', ['generated', 'sent', 'revoked']))
            ->when(!$user->isAdmin(), fn ($q) => $q->where('created_by', $user->id))
            ->orderBy('name')
            ->get();

        return Inertia::render('Certificates/Index', [
            'certificates' => $certificates,
            'projects' => $projects,
            'filters' => array_merge(
                ['search' => null, 'project' => null, 'status' => null, 'email_status' => null, 'sort' => null, 'dir' => null],
                request()->only(['search', 'project', 'status', 'email_status', 'sort', 'dir']),
            ),
        ]);
    }

    public function showDetail(Recipient $recipient): Response
    {
        $recipient->load('project:id,name,template_id,title_text,certificate_date,certificate_prefix,certificate_digit_count,created_by', 'project.creator:id,name', 'project.template:id,name');

        if ($recipient->status === 'pending') {
            abort(404);
        }

        if (!request()->user()->isAdmin() && $recipient->project->created_by !== request()->user()->id) {
            abort(403);
        }

        $certPath = $recipient->certificate_path;
        $showUrl = $certPath && Storage::disk('local')->exists($certPath)
            ? route('cert.show', $recipient->certificate_number)
            : null;

        $orgName = Setting::get('org_name', config('app.name'));

        return Inertia::render('Certificates/Show', [
            'certificate' => [
                'id' => $recipient->id,
                'name' => $recipient->name,
                'email' => $recipient->email,
                'certificate_number' => $recipient->certificate_number,
                'status' => $recipient->status,
                'email_status' => $recipient->email_status,
                'email_sent_at' => $recipient->email_sent_at?->format('d F Y H:i'),
                'revoked_at' => $recipient->revoked_at?->format('d F Y H:i'),
                'revoke_reason' => $recipient->revoke_reason,
                'created_at' => $recipient->created_at->format('d F Y'),
                'certificate_path' => $recipient->certificate_path,
                'pdf_url' => $showUrl ? $showUrl . '?inline=1' : null,
                'download_url' => $showUrl ? $showUrl . '?download=1' : null,
                'project_name' => $recipient->project->name,
                'project_id' => $recipient->project->id,
                'template_name' => $recipient->project->template?->name,
                'org_name' => $orgName,
            ],
        ]);
    }

    public function revoke(Request $request, Recipient $recipient): RedirectResponse
    {
        $recipient->load('project');

        if (!request()->user()->isAdmin() && $recipient->project->created_by !== request()->user()->id) {
            abort(403);
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

        return redirect()->back()->with('success', "Certificate for {$recipient->name} has been revoked.");
    }

    public function regenerate(Recipient $recipient, CertificateGenerator $generator): RedirectResponse
    {
        $recipient->load('project');

        if (!request()->user()->isAdmin() && $recipient->project->created_by !== request()->user()->id) {
            abort(403);
        }

        if (!in_array($recipient->status, ['pending', 'revoked'])) {
            return redirect()->back()->with('error', 'Only pending or revoked certificates can be regenerated.');
        }

        try {
            if ($recipient->certificate_path) {
                Storage::disk('local')->delete($recipient->certificate_path);
            }

            $path = $generator->generate($recipient->project, $recipient);
            $recipient->update([
                'certificate_path' => $path,
                'status' => 'generated',
                'revoked_at' => null,
                'revoke_reason' => null,
            ]);

            return redirect()->back()->with('success', "Certificate regenerated for {$recipient->name}.");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Certificate regeneration failed', [
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to regenerate certificate. Please try again.');
        }
    }

    public function show(string $certificateNumber)
    {
        $recipient = Recipient::where('certificate_number', $certificateNumber)
            ->with('project')
            ->first();

        if (!$recipient) {
            abort(404);
        }

        if ($recipient->status === 'revoked') {
            return Inertia::render('Public/CertificateRevoked', [
                'certificateNumber' => $recipient->certificate_number,
                'recipientName' => $recipient->name,
                'revokedAt' => $recipient->revoked_at?->format('d F Y'),
                'revokeReason' => $recipient->revoke_reason,
                'orgName' => Setting::get('org_name', config('app.name')),
            ]);
        }

        if (!in_array($recipient->status, ['generated', 'sent'])) {
            abort(404);
        }

        $certPath = $recipient->certificate_path;

        if (!$certPath || !Storage::disk('local')->exists($certPath)) {
            abort(404);
        }

        $fullPath = Storage::disk('local')->path($certPath);

        if (request('download')) {
            $fileName = str_replace('/', '_', $recipient->certificate_number) . '.pdf';
            return response()->file($fullPath, [
                'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            ]);
        }

        if (request('inline')) {
            $fileName = str_replace('/', '_', $recipient->certificate_number) . '.pdf';
            return response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "inline; filename=\"{$fileName}\"",
            ]);
        }

        $showUrl = route('cert.show', $recipient->certificate_number);

        $date = $recipient->project->certificate_date
            ? \Carbon\Carbon::parse($recipient->project->certificate_date)->locale('id')->isoFormat('D MMMM YYYY')
            : now()->locale('id')->isoFormat('D MMMM YYYY');

        return Inertia::render('Public/CertificateViewer', [
            'certificateNumber' => $recipient->certificate_number,
            'recipientName' => $recipient->name,
            'projectName' => $recipient->project->name,
            'date' => $date,
            'pdfUrl' => $showUrl . '?inline=1',
            'orgName' => Setting::get('org_name', config('app.name')),
            'downloadUrl' => $showUrl . '?download=1',
        ]);
    }
}
