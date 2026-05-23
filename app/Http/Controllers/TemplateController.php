<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTemplateRequest;
use App\Http\Requests\UpdateTemplateRequest;
use App\Models\Template;
use App\Models\TemplateElement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function index(): Response
    {
        $templates = Template::with('creator')
            ->when(!request()->user()->isAdmin(), fn ($q) => $q->where('created_by', request()->user()->id))
            ->latest()
            ->paginate(12);

        return Inertia::render('Templates/Index', [
            'templates' => $templates,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Templates/Create');
    }

    public function store(StoreTemplateRequest $request): RedirectResponse
    {
        $template = Template::create([
            'name' => $request->name,
            'page_width' => $request->page_width,
            'page_height' => $request->page_height,
            'orientation' => $request->orientation,
            'created_by' => $request->user()->id,
        ]);

        if ($request->hasFile('background')) {
            $path = $request->file('background')->store("templates/{$template->id}", 'public');
            $template->update(['background_image' => $path]);
        }

        return redirect()->route('templates.designer', $template)
            ->with('success', 'Template created successfully.');
    }

    public function show(Template $template): Response
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }

        $template->load('elements', 'creator');

        return Inertia::render('Templates/Show', [
            'template' => $template,
        ]);
    }

    public function designer(Template $template): Response
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }
        $template->load('elements');

        return Inertia::render('Templates/Designer', [
            'template' => $template,
        ]);
    }

    public function update(UpdateTemplateRequest $request, Template $template): RedirectResponse
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }

        $template->update($request->validated());

        if ($request->hasFile('background')) {
            if ($template->background_image) {
                Storage::disk('public')->delete($template->background_image);
            }

            $path = $request->file('background')->store("templates/{$template->id}", 'public');
            $template->update(['background_image' => $path]);
        }

        return redirect()->route('templates.index')
            ->with('success', 'Template updated successfully.');
    }

    public function destroy(Template $template): RedirectResponse
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }

        if ($template->projects()->exists()) {
            return redirect()->route('templates.index')
                ->with('error', 'Cannot delete template that has associated projects.');
        }

        if ($template->background_image) {
            Storage::disk('public')->deleteDirectory("templates/{$template->id}");
        }

        $template->elements()->delete();
        $template->delete();

        return redirect()->route('templates.index')
            ->with('success', 'Template deleted successfully.');
    }

    public function background(Request $request, Template $template): RedirectResponse
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }

        $request->validate([
            'background' => ['required', 'image', 'mimes:png,jpg,jpeg', 'max:10240'],
        ]);

        if ($template->background_image) {
            Storage::disk('public')->delete($template->background_image);
        }

        $path = $request->file('background')->store("templates/{$template->id}", 'public');
        $template->update(['background_image' => $path]);

        return redirect()->back()
            ->with('success', 'Background image uploaded successfully.');
    }

    public function elements(Request $request, Template $template): RedirectResponse
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }

        $request->validate([
            'elements' => ['required', 'array'],
            'elements.*.id' => ['nullable', 'integer'],
            'elements.*.type' => ['required', 'in:title,recipient_name,date,certificate_number,qr_code,signature,logo'],
            'elements.*.label' => ['nullable', 'string', 'max:255'],
            'elements.*.x' => ['required', 'numeric', 'min:0'],
            'elements.*.y' => ['required', 'numeric', 'min:0'],
            'elements.*.width' => ['required', 'numeric', 'min:1'],
            'elements.*.height' => ['required', 'numeric', 'min:1'],
            'elements.*.font_size' => ['nullable', 'integer', 'min:6', 'max:200'],
            'elements.*.font_family' => ['nullable', 'string', 'max:100'],
            'elements.*.font_color' => ['nullable', 'string', 'max:7'],
            'elements.*.font_style' => ['nullable', 'in:normal,bold,italic'],
            'elements.*.text_align' => ['nullable', 'in:left,center,right'],
            'elements.*.default_image' => ['nullable', 'string', 'max:500'],
            'elements.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $requestIds = collect($request->elements)->pluck('id')->filter()->toArray();

        if (!empty($requestIds)) {
            $template->elements()->whereNotIn('id', $requestIds)->delete();
        } else {
            $template->elements()->delete();
        }

        foreach ($request->elements as $index => $element) {
            $template->elements()->updateOrCreate(
                ['id' => $element['id'] ?? null],
                [
                    'type' => $element['type'],
                    'label' => $element['label'] ?? ucfirst(str_replace('_', ' ', $element['type'])),
                    'x' => $element['x'],
                    'y' => $element['y'],
                    'width' => $element['width'],
                    'height' => $element['height'],
                    'font_size' => $element['font_size'] ?? null,
                    'font_family' => $element['font_family'] ?? null,
                    'font_color' => $element['font_color'] ?? null,
                    'font_style' => $element['font_style'] ?? null,
                    'text_align' => $element['text_align'] ?? null,
                    'default_image' => $element['default_image'] ?? null,
                    'sort_order' => $element['sort_order'] ?? $index,
                ]
            );
        }

        return redirect()->route('templates.show', $template)
            ->with('success', 'Template elements saved successfully.');
    }

    public function uploadElementImageByType(Request $request, Template $template): JsonResponse
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }

        $request->validate([
            'type' => ['required', 'in:signature,logo'],
            'image' => ['required', 'image', 'mimes:png,jpg,jpeg,gif', 'max:5120'],
        ]);

        $element = $template->elements()->where('type', $request->type)->first();
        if (!$element) {
            return response()->json(['error' => 'Add the element to the canvas first.'], 422);
        }

        if ($element->default_image) {
            Storage::disk('public')->delete($element->default_image);
        }

        $path = $request->file('image')->store("templates/{$template->id}/elements", 'public');
        $element->update(['default_image' => $path]);

        return response()->json([
            'default_image' => $path,
        ]);
    }

    public function deleteElementImageByType(Request $request, Template $template): JsonResponse
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }

        $request->validate([
            'type' => ['required', 'in:signature,logo'],
        ]);

        $element = $template->elements()->where('type', $request->type)->first();
        if (!$element) {
            return response()->json(['error' => 'Element not found.'], 404);
        }

        if ($element->default_image) {
            Storage::disk('public')->delete($element->default_image);
            $element->update(['default_image' => null]);
        }

        return response()->json(['success' => true]);
    }

    public function preview(Template $template): Response
    {
        if (!request()->user()->isAdmin() && $template->created_by !== request()->user()->id) {
            abort(403);
        }

        $template->load('elements');

        return Inertia::render('Templates/Show', [
            'template' => $template,
            'preview' => true,
        ]);
    }
}
