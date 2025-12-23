<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Create dispatches table to track many-to-many relationship between incidents and responders.
     * This is the core table for the admin dispatch system, supporting:
     * - Multiple responders per incident
     * - Status tracking for each dispatch assignment
     * - Distance and ETA at time of assignment
     * - Complete timeline of dispatch progress
     */
    public function up(): void
    {
        Schema::create('dispatches', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->foreignId('incident_id')
                  ->constrained('incidents')
                  ->onDelete('cascade')
                  ->comment('Incident being responded to');

            $table->foreignId('responder_id')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->comment('Responder assigned to incident');

            $table->foreignId('assigned_by_admin_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null')
                  ->comment('Admin who made the assignment');

            // Dispatch status tracking
            $table->enum('status', [
                'assigned',   // Admin assigned responder
                'accepted',   // Responder accepted assignment
                'en_route',   // Responder is on the way
                'arrived',    // Responder arrived at scene
                'completed',  // Incident handled
                'cancelled'   // Dispatch cancelled
            ])->default('assigned')->comment('Current dispatch status');

            // Distance and time estimates (calculated at assignment time)
            $table->decimal('distance_meters', 10, 2)->nullable()
                  ->comment('Road distance in meters at time of assignment');
            $table->decimal('estimated_duration_seconds', 10, 2)->nullable()
                  ->comment('Estimated travel time in seconds');

            // Status timestamps - track complete timeline
            $table->timestamp('assigned_at')->useCurrent()
                  ->comment('When admin assigned responder');
            $table->timestamp('accepted_at')->nullable()
                  ->comment('When responder accepted');
            $table->timestamp('en_route_at')->nullable()
                  ->comment('When responder started traveling');
            $table->timestamp('arrived_at')->nullable()
                  ->comment('When responder arrived at scene');
            $table->timestamp('completed_at')->nullable()
                  ->comment('When responder completed handling');
            $table->timestamp('cancelled_at')->nullable()
                  ->comment('When dispatch was cancelled');
            $table->text('cancellation_reason')->nullable()
                  ->comment('Reason for cancellation if applicable');

            $table->timestamps();

            // Indexes for efficient queries
            $table->index('incident_id');
            $table->index('responder_id');
            $table->index('status');
            $table->index('assigned_at');

            // Prevent duplicate assignments (same responder to same incident)
            $table->unique(['incident_id', 'responder_id'], 'unique_dispatch_assignment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dispatches');
    }
};
