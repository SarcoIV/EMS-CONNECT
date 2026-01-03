<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            // MySQL/MariaDB: Modify ENUM column directly
            DB::statement("
                ALTER TABLE dispatches
                MODIFY COLUMN status ENUM(
                    'assigned',
                    'accepted',
                    'declined',
                    'en_route',
                    'arrived',
                    'completed',
                    'cancelled'
                ) NOT NULL DEFAULT 'assigned'
            ");
        } elseif ($driver === 'pgsql') {
            // PostgreSQL: Drop and recreate CHECK constraint
            DB::statement('ALTER TABLE dispatches DROP CONSTRAINT IF EXISTS dispatches_status_check');

            DB::statement("
                ALTER TABLE dispatches
                ADD CONSTRAINT dispatches_status_check
                CHECK (status::text = ANY (ARRAY[
                    'assigned'::character varying,
                    'accepted'::character varying,
                    'declined'::character varying,
                    'en_route'::character varying,
                    'arrived'::character varying,
                    'completed'::character varying,
                    'cancelled'::character varying
                ]::text[]))
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            // MySQL/MariaDB: Restore original ENUM without 'declined'
            DB::statement("
                ALTER TABLE dispatches
                MODIFY COLUMN status ENUM(
                    'assigned',
                    'accepted',
                    'en_route',
                    'arrived',
                    'completed',
                    'cancelled'
                ) NOT NULL DEFAULT 'assigned'
            ");
        } elseif ($driver === 'pgsql') {
            // PostgreSQL: Restore original CHECK constraint
            DB::statement('ALTER TABLE dispatches DROP CONSTRAINT IF EXISTS dispatches_status_check');

            DB::statement("
                ALTER TABLE dispatches
                ADD CONSTRAINT dispatches_status_check
                CHECK (status::text = ANY (ARRAY[
                    'assigned'::character varying,
                    'accepted'::character varying,
                    'en_route'::character varying,
                    'arrived'::character varying,
                    'completed'::character varying,
                    'cancelled'::character varying
                ]::text[]))
            ");
        }
    }
};
