<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CallsController extends Controller
{
    /**
     * Get incoming calls for admin (calls with status 'active' that haven't been answered).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function incoming(Request $request)
    {
        try {
            $user = $request->user();

            // Only allow admin users to see incoming calls
            if (! $user || ! $user->isAdmin()) {
                Log::warning('[CALLS] Unauthorized access attempt to incoming calls', [
                    'user_id' => $user?->id,
                    'user_role' => $user?->user_role,
                ]);

                return response()->json([
                    'message' => 'Unauthorized. Admin access required.',
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
                    'calls' => $calls->map(fn ($c) => [
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
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Answer an incoming call (admin only).
     *
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
            if (! $user || ! $user->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.',
                ], 403);
            }

            $call = Call::with('user:id,name,email,phone_number')
                ->find($validated['call_id']);

            if (! $call) {
                return response()->json([
                    'message' => 'Call not found.',
                ], 404);
            }

            // Check if call is active and not already answered
            if ($call->status !== 'active' || $call->receiver_admin_id !== null) {
                return response()->json([
                    'message' => 'Call is not available to answer.',
                    'current_status' => $call->status,
                    'is_answered' => $call->receiver_admin_id !== null,
                ], 400);
            }

            // Mark call as answered by admin (keep status as 'active')
            $call->update([
                'receiver_admin_id' => $user->id,
                'answered_at' => now(),
            ]);

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
                'message' => 'Call answered successfully.',
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to answer call', [
                'error' => $e->getMessage(),
                'call_id' => $validated['call_id'] ?? null,
                'admin_id' => $user?->id,
            ]);

            return response()->json([
                'message' => 'An error occurred while answering the call.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * End a call (admin).
     *
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

            if (! $user || ! $user->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.',
                ], 403);
            }

            // Find call where user is receiver (admin)
            $call = Call::where('id', $validated['call_id'])
                ->where(function ($query) use ($user) {
                    $query->where('receiver_admin_id', $user->id)
                        ->orWhereNull('receiver_admin_id'); // Allow ending unanswered calls
                })
                ->first();

            if (! $call) {
                return response()->json([
                    'message' => 'Call not found.',
                    'errors' => ['call_id' => ['The specified call does not exist or you do not have access to it.']],
                ], 404);
            }

            if ($call->isEnded()) {
                return response()->json([
                    'message' => 'Call has already ended.',
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
                'message' => 'Call ended successfully.',
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to end call', [
                'error' => $e->getMessage(),
                'call_id' => $validated['call_id'] ?? null,
                'admin_id' => $user?->id,
            ]);

            return response()->json([
                'message' => 'An error occurred while ending the call.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Initiate a call from admin to community user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function initiateCall(Request $request)
    {
        Log::info('[CALLS] ===== INITIATE CALL ENDPOINT HIT =====', [
            'authenticated_user' => $request->user()?->id,
            'user_role' => $request->user()?->user_role,
            'request_data' => $request->all(),
            'route_name' => $request->route()?->getName(),
            'route_uri' => $request->route()?->uri(),
            'ip' => $request->ip(),
        ]);

        try {
            $user = $request->user();

            // Only allow admin users to initiate calls
            if (! $user || ! $user->isAdmin()) {
                Log::warning('[CALLS] Unauthorized attempt to initiate call', [
                    'user_id' => $user?->id,
                    'user_role' => $user?->user_role,
                ]);

                return response()->json([
                    'message' => 'Unauthorized. Admin access required.',
                ], 403);
            }

            // Validate request
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'incident_id' => 'nullable|exists:incidents,id',
            ]);

            // Check if community user exists and has correct role
            $communityUser = \App\Models\User::find($validated['user_id']);
            if (! $communityUser || $communityUser->role !== 'community') {
                return response()->json([
                    'message' => 'Invalid user. User must be a community member.',
                    'errors' => [
                        'user_id' => ['The specified user does not exist or is not a community user.'],
                    ],
                ], 422);
            }

            // Check if incident belongs to the user if incident_id is provided
            if (isset($validated['incident_id'])) {
                $incident = \App\Models\Incident::find($validated['incident_id']);
                if (! $incident || $incident->user_id !== $communityUser->id) {
                    return response()->json([
                        'message' => 'Invalid incident. The incident must belong to the specified user.',
                        'errors' => [
                            'incident_id' => ['The incident does not belong to the specified user.'],
                        ],
                    ], 422);
                }
            }

            // Check if admin already has an active call
            $adminActiveCall = Call::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('receiver_admin_id', $user->id);
            })
                ->where('status', 'active')
                ->first();

            if ($adminActiveCall) {
                Log::info('[CALLS] Admin already has an active call', [
                    'admin_id' => $user->id,
                    'active_call_id' => $adminActiveCall->id,
                ]);

                return response()->json([
                    'message' => 'You already have an active call.',
                    'active_call' => [
                        'id' => $adminActiveCall->id,
                        'status' => $adminActiveCall->status,
                    ],
                ], 409);
            }

            // Check if community user already has an active call
            $userActiveCall = Call::where(function ($query) use ($communityUser) {
                $query->where('user_id', $communityUser->id)
                    ->orWhere('receiver_admin_id', $communityUser->id);
            })
                ->where('status', 'active')
                ->first();

            if ($userActiveCall) {
                Log::info('[CALLS] Community user already has an active call', [
                    'user_id' => $communityUser->id,
                    'active_call_id' => $userActiveCall->id,
                ]);

                return response()->json([
                    'message' => 'User already has an active call.',
                    'active_call' => [
                        'id' => $userActiveCall->id,
                        'status' => $userActiveCall->status,
                    ],
                ], 409);
            }

            // Generate unique channel name
            $channelName = Call::generateChannelName($communityUser->id, $user->id);

            // Create call record
            $call = Call::create([
                'user_id' => $communityUser->id, // Community user is the receiver
                'receiver_admin_id' => $user->id, // Admin is the initiator
                'incident_id' => $validated['incident_id'] ?? null,
                'channel_name' => $channelName,
                'status' => 'active',
                'initiator_type' => 'admin',
                'started_at' => now(),
            ]);

            Log::info('[CALLS] Admin initiated call to community user', [
                'call_id' => $call->id,
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'community_user_id' => $communityUser->id,
                'community_user_name' => $communityUser->name,
                'incident_id' => $call->incident_id,
                'channel_name' => $channelName,
            ]);

            // Create system message to automatically create a conversation in admin chats
            if ($call->incident_id) {
                Message::create([
                    'incident_id' => $call->incident_id,
                    'sender_id' => $user->id,
                    'message' => '📞 Call initiated by admin',
                    'is_read' => true, // Admin initiated, so mark as read
                ]);

                Log::info('[CALLS] System message created for admin-initiated call', [
                    'call_id' => $call->id,
                    'incident_id' => $call->incident_id,
                ]);
            }

            return response()->json([
                'call' => $call,
                'channel_name' => $channelName,
                'agora_app_id' => config('services.agora.app_id'),
                'message' => 'Call initiated successfully. Waiting for user to answer.',
            ], 201);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to initiate call', [
                'error' => $e->getMessage(),
                'admin_id' => $user?->id,
                'user_id' => $validated['user_id'] ?? null,
            ]);

            return response()->json([
                'message' => 'An error occurred while initiating the call.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get call status for admin to poll.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCallStatus(Request $request, $callId)
    {
        try {
            $user = $request->user();

            // Only allow admin users
            if (! $user || ! $user->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.',
                ], 403);
            }

            $call = Call::find($callId);

            if (! $call) {
                return response()->json([
                    'message' => 'Call not found.',
                ], 404);
            }

            // Verify the authenticated admin is involved in the call
            if ($call->receiver_admin_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized. You are not involved in this call.',
                ], 403);
            }

            return response()->json([
                'call' => [
                    'id' => $call->id,
                    'status' => $call->status,
                    'answered_at' => $call->answered_at?->toIso8601String(),
                    'ended_at' => $call->ended_at?->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to get call status', [
                'error' => $e->getMessage(),
                'call_id' => $callId,
                'admin_id' => $user?->id,
            ]);

            return response()->json([
                'message' => 'An error occurred while fetching call status.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
