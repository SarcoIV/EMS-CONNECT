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
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE pre_arrival_forms DROP INDEX pre_arrival_forms_dispatch_id_unique');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE pre_arrival_forms DROP CONSTRAINT IF EXISTS pre_arrival_forms_dispatch_id_unique');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pre_arrival_forms', function (Blueprint $table) {
            $table->unique('dispatch_id');
        });
    }
};
