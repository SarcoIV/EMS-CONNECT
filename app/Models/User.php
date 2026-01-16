<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'username',
        'email',
        'phone_number',
        'password',
        'google_id',
        'user_role',
        'role',
        'last_login_at',
        'verification_code',
        'verification_code_expires_at',
        'email_verified',
        'email_verified_at',
        'base_latitude',
        'base_longitude',
        'base_address',
        'current_latitude',
        'current_longitude',
        'location_updated_at',
        'responder_status',
        'is_on_duty',
        'duty_started_at',
        'duty_ended_at',
        'last_active_at',
        // Responder profile fields
        'badge_number',
        'hospital_assigned',
        // Community/medical profile fields
        'blood_type',
        'allergies',
        'existing_conditions',
        'medications',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified' => 'boolean',
            'email_verified_at' => 'datetime',
            'verification_code_expires_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'base_latitude' => 'decimal:8',
            'base_longitude' => 'decimal:8',
            'current_latitude' => 'decimal:8',
            'current_longitude' => 'decimal:8',
            'location_updated_at' => 'datetime',
            'is_on_duty' => 'boolean',
            'responder_status' => 'string',
            'duty_started_at' => 'datetime',
            'duty_ended_at' => 'datetime',
            'last_active_at' => 'datetime',
        ];
    }

    /**
     * Check if user is a mobile app responder
     */
    public function isResponder(): bool
    {
        return $this->role === 'responder';
    }

    /**
     * Check if user is a mobile app community member
     */
    public function isCommunity(): bool
    {
        return $this->role === 'community';
    }

    /**
     * Check if user has mobile app access
     */
    public function isMobileUser(): bool
    {
        return in_array($this->role, ['responder', 'community']);
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->user_role === 'admin';
    }

    /**
     * Get incidents created by this user
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }

    /**
     * Get incidents assigned to this admin
     */
    public function assignedIncidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'assigned_admin_id');
    }

    /**
     * Get calls made by this user
     */
    public function calls(): HasMany
    {
        return $this->hasMany(Call::class, 'user_id');
    }

    /**
     * Get calls received by this admin
     */
    public function receiverCalls(): HasMany
    {
        return $this->hasMany(Call::class, 'receiver_admin_id');
    }

    /**
     * Get messages sent by this user
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get all dispatch assignments for this responder
     */
    public function dispatches(): HasMany
    {
        return $this->hasMany(Dispatch::class, 'responder_id');
    }

    /**
     * Get the currently active dispatch for this responder (if any)
     */
    public function activeDispatch()
    {
        return $this->hasOne(Dispatch::class, 'responder_id')
            ->whereIn('status', ['assigned', 'accepted', 'en_route', 'arrived'])
            ->latest('assigned_at');
    }

    /**
     * Get all incidents assigned to this responder (many-to-many via dispatches)
     */
    public function assignedIncidentsAsResponder(): BelongsToMany
    {
        return $this->belongsToMany(Incident::class, 'dispatches', 'responder_id', 'incident_id')
            ->withPivot([
                'status',
                'distance_meters',
                'estimated_duration_seconds',
                'assigned_at',
                'accepted_at',
                'en_route_at',
                'arrived_at',
                'completed_at',
            ])
            ->withTimestamps();
    }

    /**
     * Check if responder is available for dispatch
     */
    public function isAvailableForDispatch(): bool
    {
        return $this->isResponder()
            && $this->email_verified
            && $this->is_on_duty
            && $this->responder_status === 'idle';
    }

    /**
     * Check if responder has current location data
     */
    public function hasLocation(): bool
    {
        return ! is_null($this->current_latitude) && ! is_null($this->current_longitude);
    }

    /**
     * Get formatted current location array
     */
    public function getLocationAttribute(): ?array
    {
        if (! $this->hasLocation()) {
            return null;
        }

        return [
            'latitude' => (float) $this->current_latitude,
            'longitude' => (float) $this->current_longitude,
            'updated_at' => $this->location_updated_at,
        ];
    }

    /**
     * Get formatted base location array
     */
    public function getBaseLocationAttribute(): ?array
    {
        if (is_null($this->base_latitude) || is_null($this->base_longitude)) {
            return null;
        }

        return [
            'latitude' => (float) $this->base_latitude,
            'longitude' => (float) $this->base_longitude,
            'address' => $this->base_address,
        ];
    }
}
