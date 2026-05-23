<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['name', 'template_id', 'certificate_prefix', 'certificate_digit_count', 'certificate_next_number', 'certificate_date', 'title_text', 'email_subject', 'email_body', 'status', 'created_by'])]
class Project extends Model
{
    use HasFactory;
    protected $casts = [
        'certificate_date' => 'date',
        'certificate_digit_count' => 'integer',
        'certificate_next_number' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(ProjectSignature::class);
    }

    public function logos(): HasMany
    {
        return $this->hasMany(ProjectLogo::class);
    }

    public function trainingMaterial(): HasOne
    {
        return $this->hasOne(TrainingMaterial::class);
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(Recipient::class);
    }
}
