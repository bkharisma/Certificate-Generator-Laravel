<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'background_image', 'page_width', 'page_height', 'orientation', 'created_by'])]
class Template extends Model
{
    use HasFactory;
    protected $casts = [
        'page_width' => 'decimal:2',
        'page_height' => 'decimal:2',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function elements(): HasMany
    {
        return $this->hasMany(TemplateElement::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}
