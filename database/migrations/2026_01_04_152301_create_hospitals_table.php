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
        Schema::create('hospitals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['government', 'private']);
            $table->string('address', 500);
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('phone_number', 50)->nullable();
            $table->text('specialties')->nullable(); // JSON array of specialties
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->string('website')->nullable();
            $table->integer('bed_capacity')->nullable();
            $table->boolean('has_emergency_room')->default(true);
            $table->timestamps();

            // Indexes for map queries
            $table->index(['latitude', 'longitude']);
            $table->index('type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hospitals');
    }
};
