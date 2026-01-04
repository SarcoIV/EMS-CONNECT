<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'type',
        'address',
        'latitude',
        'longitude',
        'phone_number',
        'specialties',
        'image_url',
        'is_active',
        'description',
        'website',
        'bed_capacity',
        'has_emergency_room',
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
            'specialties' => 'array',
            'is_active' => 'boolean',
            'has_emergency_room' => 'boolean',
            'bed_capacity' => 'integer',
        ];
    }

    /**
     * Get the full image URL.
     */
    public function getFullImageUrlAttribute(): ?string
    {
        if (! $this->image_url) {
            return null;
        }

        // If already a full URL, return as-is
        if (str_starts_with($this->image_url, 'http')) {
            return $this->image_url;
        }

        // Otherwise, prepend storage path
        return asset('storage/'.$this->image_url);
    }

    /**
     * Scope to get only active hospitals.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get hospitals by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
