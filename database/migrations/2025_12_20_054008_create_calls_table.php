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
            $table->foreignId('incident_id')->nullable()->constrained()->onDelete('set null');
            $table->string('channel_name')->unique();
            $table->foreignId('caller_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['calling', 'answered', 'ended', 'missed'])->default('calling');
            $table->timestamp('answered_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            // Indexes for faster queries
            $table->index('channel_name');
            $table->index('status');
            $table->index('created_at');
            $table->index(['caller_user_id', 'status']);
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
