<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['project_id', 'title', 'description', 'columns', 'rows', 'background_image'])]
class TrainingMaterial extends Model
{
    use HasFactory;
    protected $casts = [
        'columns' => 'array',
        'rows' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
