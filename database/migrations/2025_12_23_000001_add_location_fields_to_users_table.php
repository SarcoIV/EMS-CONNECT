<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add location tracking fields to users table to support hybrid location tracking:
     * - Base location: Static location (station/home) set during registration
     * - Current location: Real-time GPS location when responder is on duty
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Base location fields (static - set during responder creation)
            $table->decimal('base_latitude', 10, 8)->nullable()->after('phone_number')
                  ->comment('Static base location latitude (e.g., station, home)');
            $table->decimal('base_longitude', 11, 8)->nullable()->after('base_latitude')
                  ->comment('Static base location longitude');
            $table->string('base_address', 500)->nullable()->after('base_longitude')
                  ->comment('Human-readable base address');

            // Current location fields (dynamic - updated by mobile app when on duty)
            $table->decimal('current_latitude', 10, 8)->nullable()->after('base_address')
                  ->comment('Real-time GPS latitude when on duty');
            $table->decimal('current_longitude', 11, 8)->nullable()->after('current_latitude')
                  ->comment('Real-time GPS longitude when on duty');
            $table->timestamp('location_updated_at')->nullable()->after('current_longitude')
                  ->comment('Last time current location was updated');

            // Indexes for geospatial queries and location lookups
            $table->index(['current_latitude', 'current_longitude'], 'users_current_location_index');
            $table->index('location_updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_current_location_index');
            $table->dropIndex(['location_updated_at']);

            $table->dropColumn([
                'base_latitude',
                'base_longitude',
                'base_address',
                'current_latitude',
                'current_longitude',
                'location_updated_at',
            ]);
        });
    }
};
