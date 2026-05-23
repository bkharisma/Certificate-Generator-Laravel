<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['project_id', 'name', 'email', 'certificate_number', 'status', 'email_status', 'certificate_path', 'revoked_at', 'revoke_reason', 'email_sent_at'])]
class Recipient extends Model
{
    use HasFactory;
    protected $casts = [
        'email_sent_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
