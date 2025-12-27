<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'incident_id',
        'sender_id',
        'message',
        'image_path',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'read_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the incident this message belongs to.
     */
    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    /**
     * Get the user who sent this message.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the public URL for the image.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        return Storage::disk('public')->url($this->image_path);
    }

    /**
     * Mark this message as read.
     */
    public function markAsRead(): bool
    {
        if ($this->is_read) {
            return true;
        }

        return $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    /**
     * Check if message has an image.
     */
    public function hasImage(): bool
    {
        return ! is_null($this->image_path);
    }

    /**
     * Format message for API response.
     */
    public function toApiResponse(): array
    {
        return [
            'id' => $this->id,
            'incident_id' => $this->incident_id,
            'sender_id' => $this->sender_id,
            'sender' => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'role' => $this->sender->role,
                'user_role' => $this->sender->user_role,
            ],
            'message' => $this->message,
            'image_url' => $this->image_url,
            'is_read' => $this->is_read,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Auto-cleanup image on force delete.
     */
    protected static function booted(): void
    {
        static::forceDeleting(function (Message $message) {
            if ($message->image_path && Storage::disk('public')->exists($message->image_path)) {
                Storage::disk('public')->delete($message->image_path);
            }
        });
    }
}
