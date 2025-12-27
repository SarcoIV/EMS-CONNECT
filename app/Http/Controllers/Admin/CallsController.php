<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Services\AgoraService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CallsController extends Controller
{
    protected AgoraService $agoraService;

    public function __construct(AgoraService $agoraService)
    {
        $this->agoraService = $agoraService;
    }
    /**
     * Get incoming calls for admin (calls with status 'active' that haven't been answered).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function incoming(Request $request)
    {
        try {
            $user = $request->user();

            // Only allow admin users to see incoming calls
            if (!$user || !$user->isAdmin()) {
                Log::warning('[CALLS] Unauthorized access attempt to incoming calls', [
                    'user_id' => $user?->id,
                    'user_role' => $user?->user_role,
                ]);
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            // Log the polling request
            Log::debug('[CALLS] Admin polling for incoming calls', [
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'timestamp' => now()->toIso8601String(),
            ]);

            // Get all calls with 'active' status that haven't been answered yet
            $calls = Call::with(['user:id,name,email,phone_number', 'incident'])
                ->where('status', 'active')
                ->whereNull('receiver_admin_id') // Not yet answered by any admin
                ->orderBy('started_at', 'desc')
                ->get();

            // Log if there are incoming calls
            if ($calls->count() > 0) {
                Log::info('[CALLS] 🔔 INCOMING CALLS DETECTED', [
                    'count' => $calls->count(),
                    'admin_id' => $user->id,
                    'calls' => $calls->map(fn($c) => [
                        'call_id' => $c->id,
                        'channel_name' => $c->channel_name,
                        'caller_id' => $c->user_id,
                        'caller_name' => $c->user?->name,
                        'started_at' => $c->started_at?->toIso8601String(),
                    ])->toArray(),
                ]);
            }

            $formattedCalls = $calls->map(function ($call) {
                return [
                    'id' => $call->id,
                    'incident_id' => $call->incident_id,
                    'channel_name' => $call->channel_name,
                    'caller' => [
                        'id' => $call->user->id,
                        'name' => $call->user->name,
                        'email' => $call->user->email,
                        'phone_number' => $call->user->phone_number ?? null,
                    ],
                    'status' => $call->status,
                    'started_at' => $call->started_at?->toIso8601String(),
                    'incident' => $call->incident ? [
                        'id' => $call->incident->id,
                        'type' => $call->incident->type,
                        'location' => $call->incident->location,
                        'description' => $call->incident->description,
                    ] : null,
                ];
            });

            return response()->json([
                'calls' => $formattedCalls,
                'agora_app_id' => config('services.agora.app_id'),
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to fetch incoming calls', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while fetching incoming calls.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Answer an incoming call (admin only).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function answer(Request $request)
    {
        $validated = $request->validate([
            'call_id' => ['required', 'integer', 'exists:calls,id'],
        ], [
            'call_id.required' => 'Call ID is required.',
            'call_id.exists' => 'The specified call does not exist.',
        ]);

        try {
            $user = $request->user();

            // Only allow admin users to answer calls
            if (!$user || !$user->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $call = Call::with('user:id,name,email,phone_number')
                ->find($validated['call_id']);

            if (!$call) {
                return response()->json([
                    'message' => 'Call not found.'
                ], 404);
            }

            // Check if call is active and not already answered
            if ($call->status !== 'active' || $call->receiver_admin_id !== null) {
                return response()->json([
                    'message' => 'Call is not available to answer.',
                    'current_status' => $call->status,
                    'is_answered' => $call->receiver_admin_id !== null
                ], 400);
            }

            // Mark call as answered by admin (keep status as 'active')
            $call->update([
                'receiver_admin_id' => $user->id,
                'answered_at' => now(),
            ]);

            // Generate Agora token for the admin
            $token = $this->agoraService->generateRtcToken($call->channel_name, $user->id);

            Log::info('[CALLS] ✅ CALL ANSWERED BY ADMIN', [
                'call_id' => $call->id,
                'channel_name' => $call->channel_name,
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'caller_id' => $call->user_id,
                'caller_name' => $call->user?->name,
                'answered_at' => now()->toIso8601String(),
            ]);

            return response()->json([
                'call' => [
                    'id' => $call->id,
                    'incident_id' => $call->incident_id,
                    'channel_name' => $call->channel_name,
                    'caller' => [
                        'id' => $call->user->id,
                        'name' => $call->user->name,
                        'email' => $call->user->email,
                        'phone_number' => $call->user->phone_number ?? null,
                    ],
                    'status' => $call->status,
                    'started_at' => $call->started_at?->toIso8601String(),
                    'answered_at' => $call->answered_at?->toIso8601String(),
                ],
                'channel_name' => $call->channel_name,
                'agora_app_id' => config('services.agora.app_id'),
                'agora_token' => $token,
                'message' => 'Call answered successfully.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to answer call', [
                'error' => $e->getMessage(),
                'call_id' => $validated['call_id'] ?? null,
                'admin_id' => $user?->id,
            ]);

            return response()->json([
                'message' => 'An error occurred while answering the call.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * End a call (admin).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function end(Request $request)
    {
        $validated = $request->validate([
            'call_id' => ['required', 'integer', 'exists:calls,id'],
        ], [
            'call_id.required' => 'Call ID is required.',
            'call_id.exists' => 'The specified call does not exist.',
        ]);

        try {
            $user = $request->user();

            if (!$user || !$user->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            // Find call where user is receiver (admin)
            $call = Call::where('id', $validated['call_id'])
                ->where(function ($query) use ($user) {
                    $query->where('receiver_admin_id', $user->id)
                          ->orWhereNull('receiver_admin_id'); // Allow ending unanswered calls
                })
                ->first();

            if (!$call) {
                return response()->json([
                    'message' => 'Call not found.',
                    'errors' => ['call_id' => ['The specified call does not exist or you do not have access to it.']]
                ], 404);
            }

            if ($call->isEnded()) {
                return response()->json([
                    'message' => 'Call has already ended.'
                ], 200);
            }

            $call->update([
                'status' => 'ended',
                'ended_at' => now(),
            ]);

            Log::info('[CALLS] 🔴 CALL ENDED BY ADMIN', [
                'call_id' => $call->id,
                'channel_name' => $call->channel_name,
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'caller_id' => $call->user_id,
                'ended_at' => now()->toIso8601String(),
            ]);

            return response()->json([
                'message' => 'Call ended successfully.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to end call', [
                'error' => $e->getMessage(),
                'call_id' => $validated['call_id'] ?? null,
                'admin_id' => $user?->id,
            ]);

            return response()->json([
                'message' => 'An error occurred while ending the call.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
