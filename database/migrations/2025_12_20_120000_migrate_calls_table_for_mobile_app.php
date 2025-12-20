<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration updates the calls table to match the mobile app requirements:
     * - Renames caller_user_id to user_id
     * - Changes status enum from ['calling', 'answered', 'ended', 'missed'] to ['active', 'ended']
     * - Adds started_at timestamp field
     * - Updates existing data to match new structure
     */
    public function up(): void
    {
        // Check if we need to migrate (if caller_user_id exists)
        $columns = Schema::getColumnListing('calls');
        
        if (in_array('caller_user_id', $columns) && !in_array('user_id', $columns)) {
            // Step 1: Add started_at column if it doesn't exist
            if (!in_array('started_at', $columns)) {
                Schema::table('calls', function (Blueprint $table) {
                    $table->timestamp('started_at')->nullable()->after('status');
                });
                
                // Populate started_at with created_at for existing records
                DB::table('calls')->update(['started_at' => DB::raw('created_at')]);
                
                // Make started_at not nullable
                Schema::table('calls', function (Blueprint $table) {
                    $table->timestamp('started_at')->nullable(false)->change();
                });
            }
            
            // Step 2: Update status values: 'calling' and 'answered' -> 'active', keep 'ended'
            DB::table('calls')
                ->whereIn('status', ['calling', 'answered'])
                ->update(['status' => 'active']);
            
            DB::table('calls')
                ->where('status', 'missed')
                ->update(['status' => 'ended']);
            
            // Step 3: Rename caller_user_id to user_id
            Schema::table('calls', function (Blueprint $table) {
                $table->renameColumn('caller_user_id', 'user_id');
            });
            
            // Step 4: Update status enum to ['active', 'ended']
            // Note: This is database-specific. For PostgreSQL and MySQL 8.0+
            if (DB::getDriverName() === 'pgsql') {
                // PostgreSQL
                DB::statement("ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_status_check");
                DB::statement("ALTER TABLE calls ADD CONSTRAINT calls_status_check CHECK (status IN ('active', 'ended'))");
            } elseif (DB::getDriverName() === 'mysql') {
                // MySQL
                DB::statement("ALTER TABLE calls MODIFY COLUMN status ENUM('active', 'ended') NOT NULL DEFAULT 'active'");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if we need to reverse migration
        $columns = Schema::getColumnListing('calls');
        
        if (in_array('user_id', $columns) && !in_array('caller_user_id', $columns)) {
            // Step 1: Change status enum back to old values
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_status_check");
                DB::statement("ALTER TABLE calls ADD CONSTRAINT calls_status_check CHECK (status IN ('calling', 'answered', 'ended', 'missed'))");
            } elseif (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE calls MODIFY COLUMN status ENUM('calling', 'answered', 'ended', 'missed') NOT NULL DEFAULT 'calling'");
            }
            
            // Step 2: Update status values back: 'active' -> 'calling'
            DB::table('calls')
                ->where('status', 'active')
                ->update(['status' => 'calling']);
            
            // Step 3: Rename user_id back to caller_user_id
            Schema::table('calls', function (Blueprint $table) {
                $table->renameColumn('user_id', 'caller_user_id');
            });
            
            // Step 4: Remove started_at if it was added
            // (We'll keep it since it contains useful data)
        }
    }
};

