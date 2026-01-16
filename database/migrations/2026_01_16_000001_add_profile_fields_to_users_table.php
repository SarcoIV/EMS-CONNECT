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
        Schema::table('users', function (Blueprint $table) {
            // Responder fields
            $table->string('badge_number', 50)->nullable()->after('phone_number');
            $table->string('hospital_assigned', 255)->nullable()->after('badge_number');

            // Community/medical fields
            $table->string('blood_type', 10)->nullable()->after('hospital_assigned');
            $table->text('allergies')->nullable()->after('blood_type');
            $table->text('existing_conditions')->nullable()->after('allergies');
            $table->text('medications')->nullable()->after('existing_conditions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'badge_number',
                'hospital_assigned',
                'blood_type',
                'allergies',
                'existing_conditions',
                'medications',
            ]);
        });
    }
};
