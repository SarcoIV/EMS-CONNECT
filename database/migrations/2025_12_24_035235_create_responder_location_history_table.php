<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Create responder_location_history table to track GPS breadcrumb trail
     * for active dispatches. This allows admin to view route history and
     * playback responder movements.
     */
    public function up(): void
    {
        Schema::create('responder_location_history', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->foreignId('responder_id')
                ->constrained('users')
                ->onDelete('cascade')
                ->comment('Responder whose location is being tracked');

            $table->foreignId('dispatch_id')
                ->nullable()
                ->constrained('dispatches')
                ->onDelete('set null')
                ->comment('Associated dispatch (null if just general tracking)');

            // Location data
            $table->decimal('latitude', 10, 8)
                ->comment('GPS latitude');

            $table->decimal('longitude', 11, 8)
                ->comment('GPS longitude');

            $table->decimal('accuracy', 10, 2)
                ->nullable()
                ->comment('GPS accuracy in meters');

            // Timestamp
            $table->timestamp('created_at')
                ->useCurrent()
                ->comment('When location was recorded');

            // Indexes for efficient queries
            $table->index(['responder_id', 'created_at'], 'idx_responder_time');
            $table->index('dispatch_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('responder_location_history');
    }
};
