<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add dispatch tracking counters to incidents table.
     * These counters provide quick insight into dispatch progress without joining tables:
     * - How many responders are assigned
     * - How many are en route
     * - How many have arrived
     *
     * This supports multi-responder dispatch where multiple responders can be assigned
     * to a single incident simultaneously.
     */
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            // Dispatch counters for quick status overview
            $table->integer('responders_assigned')->default(0)->after('status')
                ->comment('Number of responders currently assigned to this incident');
            $table->integer('responders_en_route')->default(0)->after('responders_assigned')
                ->comment('Number of responders currently en route');
            $table->integer('responders_arrived')->default(0)->after('responders_en_route')
                ->comment('Number of responders who have arrived at scene');

            // Composite index for efficient filtering (e.g., "show incidents with assigned responders")
            $table->index(['status', 'responders_assigned'], 'incidents_status_assigned_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropIndex('incidents_status_assigned_index');

            $table->dropColumn([
                'responders_assigned',
                'responders_en_route',
                'responders_arrived',
            ]);
        });
    }
};
