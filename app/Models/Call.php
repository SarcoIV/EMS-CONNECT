<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Call extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'incident_id',
        'channel_name',
        'status',
        'started_at',
        'ended_at',
        'receiver_admin_id', // For backward compatibility with admin answering
        'answered_at', // For backward compatibility with admin answering
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'answered_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    /**
     * Get the incident associated with the call.
     */
    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    /**
     * Get the user (caller/community user).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the caller (community user) - alias for backward compatibility.
     */
    public function caller(): BelongsTo
    {
        return $this->user();
    }

    /**
     * Get the receiver (admin).
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_admin_id');
    }

    /**
     * Check if call is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if call has ended.
     */
    public function isEnded(): bool
    {
        return $this->status === 'ended';
    }

    /**
     * Generate unique channel name for mobile app.
     */
    public static function generateChannelName(int $userId): string
    {
        $timestamp = time();
        return "emergency_call_{$userId}_{$timestamp}";
    }
}
