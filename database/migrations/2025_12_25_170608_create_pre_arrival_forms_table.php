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
        Schema::create('pre_arrival_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispatch_id')->constrained('dispatches')->onDelete('cascade');
            $table->foreignId('responder_id')->constrained('users')->onDelete('cascade');
            $table->string('caller_name')->nullable();
            $table->string('patient_name');
            $table->enum('sex', ['Male', 'Female', 'Other']);
            $table->integer('age');
            $table->string('incident_type', 100);
            $table->timestamp('estimated_arrival')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            // Unique constraint: one pre-arrival form per dispatch
            $table->unique('dispatch_id');

            // Indexes for performance
            $table->index('responder_id');
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pre_arrival_forms');
    }
};
