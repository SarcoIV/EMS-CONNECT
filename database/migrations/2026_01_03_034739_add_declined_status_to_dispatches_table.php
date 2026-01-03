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
        // Drop existing check constraint
        DB::statement('ALTER TABLE dispatches DROP CONSTRAINT IF EXISTS dispatches_status_check');

        // Add new check constraint with 'declined' status
        DB::statement("
            ALTER TABLE dispatches
            ADD CONSTRAINT dispatches_status_check
            CHECK (status::text = ANY (ARRAY['assigned'::character varying, 'accepted'::character varying, 'declined'::character varying, 'en_route'::character varying, 'arrived'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[]))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop existing check constraint
        DB::statement('ALTER TABLE dispatches DROP CONSTRAINT IF EXISTS dispatches_status_check');

        // Restore original check constraint without 'declined'
        DB::statement("
            ALTER TABLE dispatches
            ADD CONSTRAINT dispatches_status_check
            CHECK (status::text = ANY (ARRAY['assigned'::character varying, 'accepted'::character varying, 'en_route'::character varying, 'arrived'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[]))
        ");
    }
};
