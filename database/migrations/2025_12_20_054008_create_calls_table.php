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
        Schema::create('calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('incident_id')->nullable()->constrained()->onDelete('set null');
            $table->string('channel_name')->unique();
            $table->enum('status', ['active', 'ended'])->default('active');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            // Additional fields for admin answering (backward compatibility)
            $table->foreignId('receiver_admin_id')->nullable()->constrained('users')->onDelete('set null')->after('user_id');
            $table->timestamp('answered_at')->nullable()->after('started_at');

            // Indexes for faster queries
            $table->index('channel_name');
            $table->index('status');
            $table->index('started_at');
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calls');
    }
};
