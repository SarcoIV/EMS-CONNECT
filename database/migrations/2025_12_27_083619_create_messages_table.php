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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->foreignId('incident_id')
                ->constrained('incidents')
                ->onDelete('cascade')
                ->comment('Incident this message belongs to');

            $table->foreignId('sender_id')
                ->constrained('users')
                ->onDelete('cascade')
                ->comment('User who sent the message');

            // Message content
            $table->text('message')->nullable()
                ->comment('Text message content');

            $table->string('image_path', 500)->nullable()
                ->comment('Path to uploaded image (relative to storage/app/public)');

            // Read tracking
            $table->boolean('is_read')->default(false)
                ->comment('Whether message has been read by recipient');

            $table->timestamp('read_at')->nullable()
                ->comment('When message was marked as read');

            // Timestamps
            $table->timestamps();
            $table->softDeletes()
                ->comment('Soft delete for 30-day retention policy');

            // Indexes for performance
            $table->index('incident_id');
            $table->index('sender_id');
            $table->index('created_at');
            $table->index('is_read');
            $table->index(['incident_id', 'created_at']);
            $table->index(['incident_id', 'is_read']);
            $table->index('deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
