<?php

namespace App\Http\Controllers;

use App\Exports\RecipientTemplateExport;
use App\Http\Requests\StoreRecipientRequest;
use App\Http\Requests\UpdateRecipientRequest;
use App\Imports\RecipientsImport;
use App\Models\Project;
use App\Models\Recipient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class RecipientController extends Controller
{
    private function authorizeProject(Project $project): void
    {
        if (!request()->user()->isAdmin() && $project->created_by !== request()->user()->id) {
            abort(403);
        }
    }

    public function index(Project $project): Response
    {
        $this->authorizeProject($project);
        $recipients = $project->recipients()
            ->latest()
            ->paginate(10);

        return Inertia::render('Projects/Show', [
            'project' => $project->load([
                'template:id,name,page_width,page_height,orientation,background_image',
                'template.elements',
                'creator:id,name',
                'signatures' => fn ($q) => $q->with('templateElement'),
                'logos' => fn ($q) => $q->with('templateElement'),
                'trainingMaterial',
            ])->loadCount('recipients'),
            'recipients' => $recipients,
        ]);
    }

    public function store(StoreRecipientRequest $request, Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        $exists = $project->recipients()->where('email', $request->email)->exists();
        if ($exists) {
            return redirect()->back()->with('error', 'A recipient with this email already exists in this project.');
        }

        $prefix = $project->certificate_prefix;
        $digitCount = $project->certificate_digit_count;
        $baseNumber = $project->certificate_next_number;

        $certificateNumber = null;
        for ($i = 0; $i < 1000; $i++) {
            $candidate = $prefix . '/' . str_pad((string)($baseNumber + $i), $digitCount, '0', STR_PAD_LEFT);
            if (!Recipient::where('certificate_number', $candidate)->exists()) {
                $certificateNumber = $candidate;
                break;
            }
        }

        if (!$certificateNumber) {
            return redirect()->back()->with('error', 'Unable to generate unique certificate number. Please try again.');
        }

        $project->recipients()->create([
            'name' => $request->name,
            'email' => $request->email,
            'certificate_number' => $certificateNumber,
            'status' => 'pending',
            'email_status' => 'pending',
        ]);

        $project->increment('certificate_next_number', $i + 1);

        return redirect()->back()->with('success', 'Recipient added successfully.');
    }

    public function update(UpdateRecipientRequest $request, Project $project, Recipient $recipient): RedirectResponse
    {
        $this->authorizeProject($project);

        if (!in_array($recipient->status, ['pending', 'revoked'])) {
            return redirect()->back()->with('error', 'Only pending or revoked recipients can be edited.');
        }

        $exists = $project->recipients()
            ->where('email', $request->email)
            ->where('id', '!=', $recipient->id)
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', 'Another recipient with this email already exists in this project.');
        }

        $recipient->update($request->validated());

        return redirect()->back()->with('success', 'Recipient updated successfully.');
    }

    public function destroy(Project $project, Recipient $recipient): RedirectResponse
    {
        $this->authorizeProject($project);

        if (!in_array($recipient->status, ['pending', 'revoked'])) {
            return redirect()->back()->with('error', 'Only pending or revoked recipients can be deleted.');
        }

        $recipient->delete();

        return redirect()->back()->with('success', 'Recipient deleted successfully.');
    }

    public function import(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeProject($project);

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
        ]);

        $import = new RecipientsImport($project);
        Excel::import($import, $request->file('file'));

        $imported = $import->getImportedCount();
        $errors = $import->getErrors();

        if ($imported > 0) {
            return redirect()->back()->with('success', "Imported {$imported} recipient(s) successfully." . (!empty($errors) ? ' Some rows had errors.' : ''));
        }

        return redirect()->back()->with('error', 'No recipients were imported.' . (!empty($errors) ? ' Check errors: ' . implode(' | ', $errors) : ''));
    }

    public function downloadTemplate()
    {
        return Excel::download(new RecipientTemplateExport, 'recipient-template.xlsx');
    }
}
