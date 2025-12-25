<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreArrivalForm extends Model
{
    protected $fillable = [
        'dispatch_id',
        'responder_id',
        'caller_name',
        'patient_name',
        'sex',
        'age',
        'incident_type',
        'estimated_arrival',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'estimated_arrival' => 'datetime',
            'submitted_at' => 'datetime',
            'age' => 'integer',
        ];
    }

    /**
     * Get the dispatch that owns this pre-arrival form.
     */
    public function dispatch(): BelongsTo
    {
        return $this->belongsTo(Dispatch::class);
    }

    /**
     * Get the responder who submitted this form.
     */
    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }
}
