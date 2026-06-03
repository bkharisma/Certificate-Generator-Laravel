<?php

use App\Http\Controllers\CertificateController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RecipientController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\UserController;
use App\Models\Project;
use App\Models\Recipient;
use App\Models\Template;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/cert/{certificateNumber}', [CertificateController::class, 'show'])->middleware('throttle:30,1')->where('certificateNumber', '.*')->name('cert.show');

Route::get('/home', function () {
    return Inertia::render('Public/Home', [
        'orgName' => \App\Models\Setting::get('org_name', config('app.name')),
    ]);
})->name('home');

Route::get('/', function () {
    return redirect('/home');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $user = request()->user();
        $isAdmin = $user->isAdmin();

        $projectIds = $isAdmin ? [] : Project::where('created_by', $user->id)->pluck('id');

        $totalCertificates = Recipient::whereIn('status', ['generated', 'sent'])
            ->when(!$isAdmin, fn ($q) => $q->whereIn('project_id', $projectIds))
            ->count();
        $totalTemplates = Template::when(!$isAdmin, fn ($q) => $q->where('created_by', $user->id))
            ->count();
        $totalProjects = Project::when(!$isAdmin, fn ($q) => $q->where('created_by', $user->id))
            ->count();
        $totalRecipients = Recipient::when(!$isAdmin, fn ($q) => $q->whereIn('project_id', $projectIds))
            ->count();
        $totalSent = Recipient::where('email_status', 'sent')
            ->when(!$isAdmin, fn ($q) => $q->whereIn('project_id', $projectIds))
            ->count();
        $totalRevoked = Recipient::where('status', 'revoked')
            ->when(!$isAdmin, fn ($q) => $q->whereIn('project_id', $projectIds))
            ->count();

        $recentRecipients = Recipient::with('project:id,name')
            ->whereIn('status', ['generated', 'sent', 'revoked'])
            ->when(!$isAdmin, fn ($q) => $q->whereIn('project_id', $projectIds))
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'certificate_number' => $r->certificate_number,
                'status' => $r->status,
                'project_name' => $r->project->name,
                'created_at' => $r->created_at->diffForHumans(),
            ]);

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalCertificates' => $totalCertificates,
                'totalTemplates' => $totalTemplates,
                'totalProjects' => $totalProjects,
                'totalRecipients' => $totalRecipients,
                'totalSent' => $totalSent,
                'totalRevoked' => $totalRevoked,
            ],
            'recentActivity' => $recentRecipients,
        ]);
    })->name('dashboard');

    Route::get('/templates', [TemplateController::class, 'index'])->name('templates.index');
    Route::get('/templates/create', [TemplateController::class, 'create'])->name('templates.create');
    Route::post('/templates', [TemplateController::class, 'store'])->name('templates.store');
    Route::get('/templates/{template}', [TemplateController::class, 'show'])->name('templates.show');
    Route::get('/templates/{template}/designer', [TemplateController::class, 'designer'])->name('templates.designer');
    Route::put('/templates/{template}', [TemplateController::class, 'update'])->name('templates.update');
    Route::delete('/templates/{template}', [TemplateController::class, 'destroy'])->name('templates.destroy');
    Route::post('/templates/{template}/background', [TemplateController::class, 'background'])->name('templates.background');
    Route::post('/templates/{template}/elements', [TemplateController::class, 'elements'])->name('templates.elements');
    Route::post('/templates/{template}/elements/image', [TemplateController::class, 'uploadElementImageByType'])->name('templates.elements.image.upload');
    Route::delete('/templates/{template}/elements/image', [TemplateController::class, 'deleteElementImageByType'])->name('templates.elements.image.delete');
    Route::get('/templates/{template}/preview', [TemplateController::class, 'preview'])->name('templates.preview');

    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('/projects/create', [ProjectController::class, 'create'])->name('projects.create');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::get('/projects/{project}/edit', [ProjectController::class, 'edit'])->name('projects.edit');
    Route::put('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
    Route::post('/projects/{project}/logos', [ProjectController::class, 'storeLogo'])->name('projects.logos.store');
    Route::post('/projects/{project}/logos/{logo}', [ProjectController::class, 'updateLogo'])->name('projects.logos.update');
    Route::delete('/projects/{project}/logos/{logo}', [ProjectController::class, 'destroyLogo'])->name('projects.logos.destroy');
    Route::post('/projects/{project}/signatures', [ProjectController::class, 'storeSignature'])->name('projects.signatures.store');
    Route::post('/projects/{project}/signatures/{signature}', [ProjectController::class, 'updateSignature'])->name('projects.signatures.update');
    Route::delete('/projects/{project}/signatures/{signature}', [ProjectController::class, 'destroySignature'])->name('projects.signatures.destroy');
    Route::get('/projects/{project}/recipients', [RecipientController::class, 'index'])->name('projects.recipients.index');
    Route::post('/projects/{project}/recipients', [RecipientController::class, 'store'])->name('projects.recipients.store');
    Route::post('/projects/{project}/recipients/import', [RecipientController::class, 'import'])->name('projects.recipients.import');
    Route::get('/recipients/template', [RecipientController::class, 'downloadTemplate'])->name('recipients.template');
    Route::put('/projects/{project}/recipients/{recipient}', [RecipientController::class, 'update'])->name('projects.recipients.update');
    Route::delete('/projects/{project}/recipients/{recipient}', [RecipientController::class, 'destroy'])->name('projects.recipients.destroy');
    Route::post('/projects/{project}/training-material', [ProjectController::class, 'storeTrainingMaterial'])->name('projects.training-material.store');
    Route::delete('/projects/{project}/training-material', [ProjectController::class, 'destroyTrainingMaterial'])->name('projects.training-material.destroy');
    Route::post('/projects/{project}/generate', [ProjectController::class, 'generate'])->name('projects.generate');
    Route::get('/projects/{project}/preview', [ProjectController::class, 'preview'])->name('projects.preview');
    Route::post('/projects/{project}/generate/{recipient}', [ProjectController::class, 'generateSingle'])->name('projects.generate.single');
    Route::post('/projects/{project}/regenerate/{recipient}', [ProjectController::class, 'regenerate'])->name('projects.regenerate');
    Route::post('/projects/{project}/regenerate-all', [ProjectController::class, 'regenerateAll'])->name('projects.regenerate-all');
    Route::post('/projects/{project}/revoke-all', [ProjectController::class, 'revokeAll'])->name('projects.revoke-all');
    Route::post('/projects/{project}/revoke/{recipient}', [ProjectController::class, 'revokeSingle'])->name('projects.revoke');
    Route::post('/projects/{project}/send/{recipient}', [ProjectController::class, 'sendEmail'])->name('projects.send-email');
    Route::post('/projects/{project}/send-all', [ProjectController::class, 'sendAllEmails'])->name('projects.send-all');
    Route::get('/projects/{project}/download-zip', [ProjectController::class, 'downloadZip'])->name('projects.download-zip');
    Route::get('/certificates', [CertificateController::class, 'index'])->name('certificates.index');
    Route::get('/certificates/{recipient}', [CertificateController::class, 'showDetail'])->name('certificates.show');
    Route::post('/certificates/{recipient}/revoke', [CertificateController::class, 'revoke'])->name('certificates.revoke');
    Route::post('/certificates/{recipient}/regenerate', [CertificateController::class, 'regenerate'])->name('certificates.regenerate');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::post('/users/bulk', [UserController::class, 'bulkStore'])->name('users.bulk');
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::post('/settings/test-mail', [SettingsController::class, 'testMail'])->name('settings.test-mail');
});

require __DIR__.'/auth.php';
