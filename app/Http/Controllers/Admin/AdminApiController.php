<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PreArrivalForm;
use App\Models\ResponderLocationHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Admin API Controller
 *
 * Provides real-time data endpoints for admin dashboard:
 * - Active responders
 * - Location history
 * - Pre-arrival forms
 */
class AdminApiController extends Controller
{
    /**
     * Get all active responders with their current locations.
     *
     * GET /api/admin/responders/active
     */
    public function getActiveResponders(Request $request)
    {
        try {
            // Get all responders who are currently on duty
            $responders = User::where('role', 'responder')
                ->where('is_on_duty', true)
                ->whereNotNull('current_latitude')
                ->whereNotNull('current_longitude')
                ->with(['activeDispatch.incident'])
                ->get()
                ->map(function ($responder) {
                    return [
                        'id' => $responder->id,
                        'name' => $responder->name,
                        'email' => $responder->email,
                        'phone_number' => $responder->phone_number,
                        'latitude' => (float) $responder->current_latitude,
                        'longitude' => (float) $responder->current_longitude,
                        'status' => $responder->responder_status,
                        'is_on_duty' => $responder->is_on_duty,
                        'last_active_at' => $responder->last_active_at?->toIso8601String(),
                        'location_updated_at' => $responder->location_updated_at?->toIso8601String(),
                        'dispatch' => $responder->activeDispatch ? [
                            'id' => $responder->activeDispatch->id,
                            'incident_id' => $responder->activeDispatch->incident_id,
                            'status' => $responder->activeDispatch->status,
                            'assigned_at' => $responder->activeDispatch->assigned_at?->toIso8601String(),
                            'incident' => [
                                'id' => $responder->activeDispatch->incident->id,
                                'type' => $responder->activeDispatch->incident->type,
                                'latitude' => (float) $responder->activeDispatch->incident->latitude,
                                'longitude' => (float) $responder->activeDispatch->incident->longitude,
                                'address' => $responder->activeDispatch->incident->address,
                            ],
                        ] : null,
                    ];
                });

            Log::info('[ADMIN_API] 📍 Fetched active responders', [
                'count' => $responders->count(),
                'admin_id' => $request->user()?->id,
            ]);

            return response()->json([
                'responders' => $responders,
                'count' => $responders->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('[ADMIN_API] ❌ Failed to fetch active responders', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch active responders',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get location history for a specific responder.
     *
     * GET /api/admin/responders/{responderId}/location-history
     */
    public function getLocationHistory(Request $request, $responderId)
    {
        try {
            $validated = $request->validate([
                'dispatch_id' => ['nullable', 'integer', 'exists:dispatches,id'],
                'start_date' => ['nullable', 'date'],
                'end_date' => ['nullable', 'date'],
                'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
            ]);

            $query = ResponderLocationHistory::where('user_id', $responderId);

            // Filter by dispatch if provided
            if (isset($validated['dispatch_id'])) {
                $query->where('dispatch_id', $validated['dispatch_id']);
            }

            // Filter by date range if provided
            if (isset($validated['start_date'])) {
                $query->where('created_at', '>=', $validated['start_date']);
            }

            if (isset($validated['end_date'])) {
                $query->where('created_at', '<=', $validated['end_date']);
            }

            // Apply limit (default: 500 records)
            $limit = $validated['limit'] ?? 500;

            $history = $query->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($record) {
                    return [
                        'latitude' => (float) $record->latitude,
                        'longitude' => (float) $record->longitude,
                        'accuracy' => $record->accuracy,
                        'created_at' => $record->created_at->toIso8601String(),
                        'dispatch_id' => $record->dispatch_id,
                    ];
                });

            Log::info('[ADMIN_API] 📊 Fetched location history', [
                'responder_id' => $responderId,
                'records_count' => $history->count(),
                'dispatch_id' => $validated['dispatch_id'] ?? null,
                'admin_id' => $request->user()?->id,
            ]);

            return response()->json([
                'history' => $history,
                'count' => $history->count(),
                'responder_id' => (int) $responderId,
            ]);
        } catch (\Exception $e) {
            Log::error('[ADMIN_API] ❌ Failed to fetch location history', [
                'responder_id' => $responderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch location history',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get pre-arrival forms for a specific incident.
     *
     * GET /api/admin/incidents/{incidentId}/pre-arrival
     */
    public function getPreArrivalForms(Request $request, $incidentId)
    {
        try {
            // Get all dispatches for this incident with their pre-arrival forms
            $preArrivalForms = PreArrivalForm::whereHas('dispatch', function ($query) use ($incidentId) {
                $query->where('incident_id', $incidentId);
            })
                ->with(['dispatch', 'responder'])
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(function ($form) {
                    return [
                        'id' => $form->id,
                        'dispatch_id' => $form->dispatch_id,
                        'responder_id' => $form->responder_id,
                        'responder_name' => $form->responder->name,
                        'caller_name' => $form->caller_name,
                        'patient_name' => $form->patient_name,
                        'sex' => $form->sex,
                        'age' => $form->age,
                        'incident_type' => $form->incident_type,
                        'estimated_arrival' => $form->estimated_arrival?->toIso8601String(),
                        'submitted_at' => $form->submitted_at?->toIso8601String(),
                        'dispatch_status' => $form->dispatch->status,
                    ];
                });

            Log::info('[ADMIN_API] 📋 Fetched pre-arrival forms', [
                'incident_id' => $incidentId,
                'forms_count' => $preArrivalForms->count(),
                'admin_id' => $request->user()?->id,
            ]);

            return response()->json([
                'pre_arrival_forms' => $preArrivalForms,
                'count' => $preArrivalForms->count(),
                'incident_id' => (int) $incidentId,
            ]);
        } catch (\Exception $e) {
            Log::error('[ADMIN_API] ❌ Failed to fetch pre-arrival forms', [
                'incident_id' => $incidentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch pre-arrival forms',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
