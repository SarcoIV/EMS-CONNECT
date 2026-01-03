<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispatch extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'incident_id',
        'responder_id',
        'assigned_by_admin_id',
        'status',
        'distance_meters',
        'estimated_duration_seconds',
        'assigned_at',
        'accepted_at',
        'en_route_at',
        'arrived_at',
        'completed_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'distance_meters' => 'decimal:2',
            'estimated_duration_seconds' => 'decimal:2',
            'assigned_at' => 'datetime',
            'accepted_at' => 'datetime',
            'en_route_at' => 'datetime',
            'arrived_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Get the incident this dispatch is for.
     */
    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    /**
     * Get the responder assigned to this dispatch.
     */
    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }

    /**
     * Get the admin who made this assignment.
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_admin_id');
    }

    /**
     * Scope: Get only active dispatches (not completed or cancelled).
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived']);
    }

    /**
     * Scope: Get dispatches for a specific incident.
     */
    public function scopeForIncident(Builder $query, int $incidentId): Builder
    {
        return $query->where('incident_id', $incidentId);
    }

    /**
     * Scope: Get dispatches for a specific responder.
     */
    public function scopeForResponder(Builder $query, int $responderId): Builder
    {
        return $query->where('responder_id', $responderId);
    }

    /**
     * Mark dispatch as accepted by responder.
     */
    public function accept(): bool
    {
        $this->status = 'accepted';
        $this->accepted_at = now();

        return $this->save();
    }

    /**
     * Mark responder as en route to incident.
     */
    public function markEnRoute(): bool
    {
        $this->status = 'en_route';
        $this->en_route_at = now();

        return $this->save();
    }

    /**
     * Mark responder as arrived at incident scene.
     */
    public function markArrived(): bool
    {
        $this->status = 'arrived';
        $this->arrived_at = now();

        return $this->save();
    }

    /**
     * Mark dispatch as completed.
     */
    public function complete(): bool
    {
        $this->status = 'completed';
        $this->completed_at = now();

        return $this->save();
    }

    /**
     * Decline this dispatch (responder rejects assignment).
     */
    public function decline(?string $reason = null): bool
    {
        $this->status = 'declined';
        $this->cancelled_at = now(); // Reuse cancelled_at for declined timestamp
        $this->cancellation_reason = $reason;

        return $this->save();
    }

    /**
     * Cancel this dispatch.
     */
    public function cancel(?string $reason = null): bool
    {
        $this->status = 'cancelled';
        $this->cancelled_at = now();
        $this->cancellation_reason = $reason;

        return $this->save();
    }

    /**
     * Get formatted distance string.
     */
    public function getFormattedDistanceAttribute(): string
    {
        if (! $this->distance_meters) {
            return 'N/A';
        }

        if ($this->distance_meters < 1000) {
            return number_format($this->distance_meters, 0).' m';
        }

        return number_format($this->distance_meters / 1000, 2).' km';
    }

    /**
     * Get formatted duration string.
     */
    public function getFormattedDurationAttribute(): string
    {
        if (! $this->estimated_duration_seconds) {
            return 'N/A';
        }

        $minutes = floor($this->estimated_duration_seconds / 60);
        $seconds = $this->estimated_duration_seconds % 60;

        if ($minutes < 1) {
            return number_format($seconds, 0).' sec';
        }

        return number_format($minutes, 0).' min';
    }

    /**
     * Check if dispatch is active (not completed or cancelled).
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['assigned', 'accepted', 'en_route', 'arrived']);
    }

    /**
     * Check if dispatch is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if dispatch is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }
}
