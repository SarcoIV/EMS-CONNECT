<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add new columns
        Schema::table('dispatches', function (Blueprint $table) {
            $table->foreignId('hospital_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('transporting_to_hospital_at')->nullable();
            $table->decimal('hospital_distance_meters', 10, 2)->nullable();
            $table->decimal('hospital_estimated_duration_seconds', 10, 2)->nullable();
            $table->json('hospital_route_data')->nullable();
        });

        // Update status enum with database driver detection
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("
                ALTER TABLE dispatches
                MODIFY COLUMN status ENUM(
                    'assigned', 'accepted', 'declined', 'en_route',
                    'arrived', 'transporting_to_hospital', 'completed', 'cancelled'
                ) NOT NULL DEFAULT 'assigned'
            ");
        } elseif ($driver === 'pgsql') {
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
                    'transporting_to_hospital'::character varying,
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
        // Revert status enum
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("
                ALTER TABLE dispatches
                MODIFY COLUMN status ENUM(
                    'assigned', 'accepted', 'declined', 'en_route',
                    'arrived', 'completed', 'cancelled'
                ) NOT NULL DEFAULT 'assigned'
            ");
        } elseif ($driver === 'pgsql') {
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

        // Drop columns
        Schema::table('dispatches', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->dropColumn([
                'hospital_id',
                'transporting_to_hospital_at',
                'hospital_distance_meters',
                'hospital_estimated_duration_seconds',
                'hospital_route_data',
            ]);
        });
    }
};
