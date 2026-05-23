<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['project_id', 'template_element_id', 'signature_image', 'signer_name', 'signer_title', 'sort_order'])]
class ProjectSignature extends Model
{
    use HasFactory;
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function templateElement(): BelongsTo
    {
        return $this->belongsTo(TemplateElement::class);
    }
}
