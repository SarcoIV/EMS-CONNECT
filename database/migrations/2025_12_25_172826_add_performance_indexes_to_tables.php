<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes to users table for responder queries
        Schema::table('users', function (Blueprint $table) {
            $table->index('is_on_duty', 'idx_users_is_on_duty');
            $table->index('responder_status', 'idx_users_responder_status');
            $table->index('last_active_at', 'idx_users_last_active_at');
            $table->index('role', 'idx_users_role');

            // Composite indexes for common queries
            $table->index(['role', 'is_on_duty'], 'idx_users_role_on_duty');
            $table->index(['is_on_duty', 'last_active_at'], 'idx_users_duty_last_active');
        });

        // Add indexes to dispatches table for status queries
        Schema::table('dispatches', function (Blueprint $table) {
            $table->index('status', 'idx_dispatches_status');
            $table->index('responder_id', 'idx_dispatches_responder_id');
            $table->index('incident_id', 'idx_dispatches_incident_id');

            // Composite indexes for finding active dispatches
            $table->index(['responder_id', 'status'], 'idx_dispatches_responder_status');
            $table->index(['incident_id', 'status'], 'idx_dispatches_incident_status');
        });

        // Add indexes to pre_arrival_forms table
        Schema::table('pre_arrival_forms', function (Blueprint $table) {
            $table->index('responder_id', 'idx_pre_arrival_responder_id');
            $table->index('submitted_at', 'idx_pre_arrival_submitted_at');
        });

        // Add indexes to incidents table for status and type filtering
        Schema::table('incidents', function (Blueprint $table) {
            $table->index('status', 'idx_incidents_status');
            $table->index('type', 'idx_incidents_type');
            $table->index('user_id', 'idx_incidents_user_id');
            $table->index('created_at', 'idx_incidents_created_at');

            // Composite index for common queries
            $table->index(['status', 'created_at'], 'idx_incidents_status_created');
        });

        // Add spatial indexes for location-based queries (if supported)
        // Note: MySQL 5.7+ supports spatial indexes on InnoDB
        if (Schema::hasColumn('users', 'current_latitude') && Schema::hasColumn('users', 'current_longitude')) {
            // Index for location queries (helps with nearby responder searches)
            Schema::table('users', function (Blueprint $table) {
                $table->index(['current_latitude', 'current_longitude'], 'idx_users_current_location');
                $table->index(['base_latitude', 'base_longitude'], 'idx_users_base_location');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_is_on_duty');
            $table->dropIndex('idx_users_responder_status');
            $table->dropIndex('idx_users_last_active_at');
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_role_on_duty');
            $table->dropIndex('idx_users_duty_last_active');

            if (Schema::hasColumn('users', 'current_latitude')) {
                $table->dropIndex('idx_users_current_location');
                $table->dropIndex('idx_users_base_location');
            }
        });

        // Drop indexes from dispatches table
        Schema::table('dispatches', function (Blueprint $table) {
            $table->dropIndex('idx_dispatches_status');
            $table->dropIndex('idx_dispatches_responder_id');
            $table->dropIndex('idx_dispatches_incident_id');
            $table->dropIndex('idx_dispatches_responder_status');
            $table->dropIndex('idx_dispatches_incident_status');
        });

        // Drop indexes from pre_arrival_forms table
        Schema::table('pre_arrival_forms', function (Blueprint $table) {
            $table->dropIndex('idx_pre_arrival_responder_id');
            $table->dropIndex('idx_pre_arrival_submitted_at');
        });

        // Drop indexes from incidents table
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropIndex('idx_incidents_status');
            $table->dropIndex('idx_incidents_type');
            $table->dropIndex('idx_incidents_user_id');
            $table->dropIndex('idx_incidents_created_at');
            $table->dropIndex('idx_incidents_status_created');
        });
    }
};
