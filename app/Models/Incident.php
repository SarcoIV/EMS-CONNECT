<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Incident extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'type',
        'status',
        'latitude',
        'longitude',
        'address',
        'description',
        'assigned_unit',
        'assigned_admin_id',
        'dispatched_at',
        'completed_at',
        'responders_assigned',
        'responders_en_route',
        'responders_arrived',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'dispatched_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the user who created the incident.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin assigned to the incident.
     */
    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_admin_id');
    }

    /**
     * Get the calls associated with this incident.
     */
    public function calls(): HasMany
    {
        return $this->hasMany(Call::class);
    }

    /**
     * Get all dispatch assignments for this incident.
     */
    public function dispatches(): HasMany
    {
        return $this->hasMany(Dispatch::class);
    }

    /**
     * Get all responders assigned to this incident (many-to-many via dispatches).
     */
    public function assignedResponders(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'dispatches', 'incident_id', 'responder_id')
            ->withPivot([
                'status',
                'distance_meters',
                'estimated_duration_seconds',
                'assigned_at',
                'accepted_at',
                'en_route_at',
                'arrived_at',
                'completed_at',
                'cancelled_at',
            ])
            ->withTimestamps();
    }

    /**
     * Get all messages for this incident.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Check if incident is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if incident is dispatched.
     */
    public function isDispatched(): bool
    {
        return $this->status === 'dispatched';
    }

    /**
     * Check if incident is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if incident is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Check if incident can be cancelled.
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'dispatched']);
    }

    /**
     * Get formatted location array.
     */
    public function getLocationAttribute(): array
    {
        return [
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'address' => $this->address,
        ];
    }

    /**
     * Check if more responders can be assigned to this incident.
     */
    public function canAssignMoreResponders(): bool
    {
        return ! in_array($this->status, ['completed', 'cancelled']);
    }

    /**
     * Check if incident has any active dispatches.
     */
    public function hasActiveDispatches(): bool
    {
        return $this->dispatches()
            ->whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived'])
            ->exists();
    }
}
