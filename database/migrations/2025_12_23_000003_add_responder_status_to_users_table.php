<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add responder status tracking fields to users table.
     * This enables automatic availability management based on responder's current status.
     *
     * Status flow:
     * - offline: Responder is off duty (not available)
     * - idle: Responder is on duty and available for dispatch
     * - assigned: Responder has been assigned to an incident
     * - en_route: Responder is traveling to incident
     * - busy: Responder is handling an incident (arrived/in progress)
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Real-time availability status for responders
            $table->enum('responder_status', [
                'offline',   // Off duty - not available
                'idle',      // On duty and available
                'assigned',  // Assigned to incident
                'en_route',  // Traveling to incident
                'busy'       // Handling incident
            ])->default('offline')->after('role')
              ->comment('Real-time availability status for responders');

            // Duty tracking
            $table->boolean('is_on_duty')->default(false)->after('responder_status')
                  ->comment('Whether responder is currently on duty');
            $table->timestamp('duty_started_at')->nullable()->after('is_on_duty')
                  ->comment('When responder started current duty shift');
            $table->timestamp('duty_ended_at')->nullable()->after('duty_started_at')
                  ->comment('When responder ended current duty shift');

            // Indexes for efficient availability queries
            $table->index('responder_status');
            $table->index('is_on_duty');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['responder_status']);
            $table->dropIndex(['is_on_duty']);

            $table->dropColumn([
                'responder_status',
                'is_on_duty',
                'duty_started_at',
                'duty_ended_at',
            ]);
        });
    }
};
