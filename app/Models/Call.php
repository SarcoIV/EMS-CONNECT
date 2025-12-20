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
        'incident_id',
        'channel_name',
        'caller_user_id',
        'receiver_admin_id',
        'status',
        'answered_at',
        'ended_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
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
     * Get the caller (community user).
     */
    public function caller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'caller_user_id');
    }

    /**
     * Get the receiver (admin).
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_admin_id');
    }

    /**
     * Check if call is active (calling or answered).
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['calling', 'answered']);
    }

    /**
     * Check if call is calling.
     */
    public function isCalling(): bool
    {
        return $this->status === 'calling';
    }

    /**
     * Check if call is answered.
     */
    public function isAnswered(): bool
    {
        return $this->status === 'answered';
    }

    /**
     * Check if call has ended.
     */
    public function isEnded(): bool
    {
        return $this->status === 'ended';
    }

    /**
     * Check if call was missed.
     */
    public function isMissed(): bool
    {
        return $this->status === 'missed';
    }

    /**
     * Generate unique channel name.
     */
    public static function generateChannelName(int $userId): string
    {
        $timestamp = time();
        $random = substr(md5(uniqid()), 0, 6);
        return "ems_{$userId}_{$timestamp}_{$random}";
    }
}
