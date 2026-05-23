<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['template_id', 'type', 'label', 'x', 'y', 'width', 'height', 'font_size', 'font_family', 'font_color', 'font_style', 'text_align', 'default_image', 'sort_order'])]
class TemplateElement extends Model
{
    use HasFactory;
    protected $casts = [
        'x' => 'decimal:2',
        'y' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }
}
