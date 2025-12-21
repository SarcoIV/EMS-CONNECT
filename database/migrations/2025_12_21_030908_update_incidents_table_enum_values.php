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
     * Updates the incidents table enum values to include:
     * - type: 'crime' and 'natural_disaster'
     * - status: 'in_progress'
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: Modify the CHECK constraint
            DB::statement("ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_type_check");
            DB::statement("ALTER TABLE incidents ADD CONSTRAINT incidents_type_check CHECK (type IN ('medical', 'fire', 'accident', 'crime', 'natural_disaster', 'other'))");
            
            DB::statement("ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check");
            DB::statement("ALTER TABLE incidents ADD CONSTRAINT incidents_status_check CHECK (status IN ('pending', 'dispatched', 'in_progress', 'completed', 'cancelled'))");
        } elseif ($driver === 'mysql' || $driver === 'mariadb') {
            // MySQL/MariaDB: Modify ENUM columns
            DB::statement("ALTER TABLE incidents MODIFY COLUMN type ENUM('medical', 'fire', 'accident', 'crime', 'natural_disaster', 'other') DEFAULT 'medical'");
            DB::statement("ALTER TABLE incidents MODIFY COLUMN status ENUM('pending', 'dispatched', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: Revert to original values
            DB::statement("ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_type_check");
            DB::statement("ALTER TABLE incidents ADD CONSTRAINT incidents_type_check CHECK (type IN ('medical', 'fire', 'accident', 'other'))");
            
            DB::statement("ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check");
            DB::statement("ALTER TABLE incidents ADD CONSTRAINT incidents_status_check CHECK (status IN ('pending', 'dispatched', 'completed', 'cancelled'))");
        } elseif ($driver === 'mysql' || $driver === 'mariadb') {
            // MySQL/MariaDB: Revert to original ENUM values
            DB::statement("ALTER TABLE incidents MODIFY COLUMN type ENUM('medical', 'fire', 'accident', 'other') DEFAULT 'medical'");
            DB::statement("ALTER TABLE incidents MODIFY COLUMN status ENUM('pending', 'dispatched', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }
};
