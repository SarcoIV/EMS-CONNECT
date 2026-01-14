<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Incident;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CallController extends Controller
{
    /**
     * Start a new emergency call.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function start(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'incident_id' => ['nullable', 'integer', 'exists:incidents,id'],
        ], [
            'incident_id.exists' => 'The specified incident does not exist.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user();

            // Check if user already has an active call
            $activeCall = Call::where('user_id', $user->id)
                ->where('status', 'active')
                ->first();

            if ($activeCall) {
                return response()->json([
                    'call' => [
                        'id' => $activeCall->id,
                        'user_id' => $activeCall->user_id,
                        'incident_id' => $activeCall->incident_id,
                        'channel_name' => $activeCall->channel_name,
                        'status' => $activeCall->status,
                        'started_at' => $activeCall->started_at?->toIso8601String(),
                        'ended_at' => $activeCall->ended_at?->toIso8601String(),
                    ],
                    'channel_name' => $activeCall->channel_name,
                    'agora_app_id' => config('services.agora.app_id'),
                    'message' => 'You already have an active call.',
                ], 200);
            }

            // Verify incident belongs to user if incident_id provided
            if ($request->incident_id) {
                $incident = Incident::where('id', $request->incident_id)
                    ->where('user_id', $user->id)
                    ->first();

                if (! $incident) {
                    return response()->json([
                        'message' => 'Incident not found.',
                        'errors' => ['incident_id' => ['The specified incident does not exist or you do not have access to it.']],
                    ], 404);
                }
            }

            // Generate unique channel name
            $channelName = Call::generateChannelName($user->id);

            // Create call
            $call = Call::create([
                'user_id' => $user->id,
                'incident_id' => $request->incident_id,
                'channel_name' => $channelName,
                'status' => 'active',
                'started_at' => now(),
            ]);

            Log::info('[CALLS] 📞 NEW EMERGENCY CALL FROM MOBILE APP', [
                'call_id' => $call->id,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'incident_id' => $request->incident_id,
                'channel_name' => $channelName,
                'started_at' => now()->toIso8601String(),
            ]);

            // Create system message to automatically create a conversation in admin chats
            if ($call->incident_id) {
                Message::create([
                    'incident_id' => $call->incident_id,
                    'sender_id' => $user->id,
                    'message' => '📞 Call started',
                    'is_read' => false,
                ]);

                Log::info('[CALLS] System message created for conversation', [
                    'call_id' => $call->id,
                    'incident_id' => $call->incident_id,
                ]);
            }

            return response()->json([
                'call' => [
                    'id' => $call->id,
                    'user_id' => $call->user_id,
                    'incident_id' => $call->incident_id,
                    'channel_name' => $call->channel_name,
                    'status' => $call->status,
                    'started_at' => $call->started_at?->toIso8601String(),
                    'ended_at' => $call->ended_at,
                ],
                'channel_name' => $channelName,
                'agora_app_id' => config('services.agora.app_id'),
            ], 201);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to start call from mobile', [
                'error' => $e->getMessage(),
                'user_id' => $user->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while starting the call. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * End an active call.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function end(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'call_id' => ['required', 'integer', 'exists:calls,id'],
        ], [
            'call_id.required' => 'Call ID is required.',
            'call_id.exists' => 'The specified call does not exist.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user();

            // Find call where user is either caller or receiver
            $call = Call::where('id', $request->call_id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhere('receiver_admin_id', $user->id);
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
                    'call' => [
                        'id' => $call->id,
                        'user_id' => $call->user_id,
                        'incident_id' => $call->incident_id,
                        'channel_name' => $call->channel_name,
                        'status' => $call->status,
                        'started_at' => $call->started_at?->toIso8601String(),
                        'ended_at' => $call->ended_at?->toIso8601String(),
                    ],
                ], 200);
            }

            $call->update([
                'status' => 'ended',
                'ended_at' => now(),
            ]);

            Log::info('Call ended', [
                'call_id' => $call->id,
                'ended_by_user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Call ended successfully.',
                'call' => [
                    'id' => $call->id,
                    'user_id' => $call->user_id,
                    'incident_id' => $call->incident_id,
                    'channel_name' => $call->channel_name,
                    'status' => $call->status,
                    'started_at' => $call->started_at?->toIso8601String(),
                    'ended_at' => $call->ended_at?->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to end call: '.$e->getMessage());

            return response()->json([
                'message' => 'An error occurred while ending the call. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get active call for authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function active(Request $request)
    {
        try {
            $user = $request->user();

            $call = Call::where('user_id', $user->id)
                ->where('status', 'active')
                ->orderBy('started_at', 'desc')
                ->first();

            if (! $call) {
                return response()->json([
                    'has_active_call' => false,
                    'call' => null,
                ], 200);
            }

            return response()->json([
                'has_active_call' => true,
                'call' => [
                    'id' => $call->id,
                    'user_id' => $call->user_id,
                    'incident_id' => $call->incident_id,
                    'channel_name' => $call->channel_name,
                    'status' => $call->status,
                    'started_at' => $call->started_at?->toIso8601String(),
                    'ended_at' => $call->ended_at,
                ],
                'channel_name' => $call->channel_name,
                'agora_app_id' => config('services.agora.app_id'),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch active call: '.$e->getMessage());

            return response()->json([
                'message' => 'An error occurred while fetching active call.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get incoming calls for admin (calls with status 'active' waiting for admin).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    /**
     * Poll for incoming admin-initiated calls.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function incoming(Request $request)
    {
        try {
            $user = $request->user();

            // Get admin-initiated calls for this user that haven't been answered yet
            $call = Call::with(['receiver:id,name,email', 'incident'])
                ->where('user_id', $user->id)
                ->where('initiator_type', 'admin')
                ->where('status', 'active')
                ->whereNull('answered_at')
                ->orderBy('started_at', 'desc')
                ->first();

            if (! $call) {
                return response()->json([
                    'has_incoming_call' => false,
                    'call' => null,
                ], 200);
            }

            Log::info('[CALLS] Mobile user polling detected incoming admin call', [
                'call_id' => $call->id,
                'user_id' => $user->id,
                'admin_id' => $call->receiver_admin_id,
            ]);

            return response()->json([
                'has_incoming_call' => true,
                'call' => [
                    'id' => $call->id,
                    'incident_id' => $call->incident_id,
                    'channel_name' => $call->channel_name,
                    'admin_caller' => [
                        'id' => $call->receiver->id,
                        'name' => $call->receiver->name,
                        'email' => $call->receiver->email,
                    ],
                    'incident' => $call->incident ? [
                        'id' => $call->incident->id,
                        'type' => $call->incident->type,
                        'location' => $call->incident->location,
                        'description' => $call->incident->description,
                    ] : null,
                    'started_at' => $call->started_at->toIso8601String(),
                ],
                'agora_app_id' => config('services.agora.app_id'),
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to poll for incoming admin calls', [
                'error' => $e->getMessage(),
                'user_id' => $user?->id,
            ]);

            return response()->json([
                'message' => 'An error occurred while checking for incoming calls.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Answer an admin-initiated call.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function answer(Request $request)
    {
        try {
            $user = $request->user();

            // Validate request
            $validated = $request->validate([
                'call_id' => 'required|exists:calls,id',
            ]);

            $call = Call::with(['receiver', 'incident'])->find($validated['call_id']);

            if (! $call) {
                return response()->json([
                    'message' => 'Call not found.',
                ], 404);
            }

            // Verify the call belongs to the authenticated user
            if ($call->user_id !== $user->id) {
                Log::warning('[CALLS] Unauthorized attempt to answer call', [
                    'call_id' => $call->id,
                    'user_id' => $user->id,
                    'call_user_id' => $call->user_id,
                ]);

                return response()->json([
                    'message' => 'Unauthorized. This call does not belong to you.',
                ], 403);
            }

            // Verify call is admin-initiated
            if ($call->initiator_type !== 'admin') {
                return response()->json([
                    'message' => 'Invalid call type. This endpoint is for admin-initiated calls only.',
                ], 422);
            }

            // Verify call is active and unanswered
            if ($call->status !== 'active') {
                return response()->json([
                    'message' => 'Call is not active.',
                ], 422);
            }

            if ($call->answered_at !== null) {
                return response()->json([
                    'message' => 'Call has already been answered.',
                ], 422);
            }

            // Update call as answered
            $call->update([
                'answered_at' => now(),
            ]);

            Log::info('[CALLS] Community user answered admin-initiated call', [
                'call_id' => $call->id,
                'user_id' => $user->id,
                'admin_id' => $call->receiver_admin_id,
                'answered_at' => $call->answered_at->toIso8601String(),
            ]);

            return response()->json([
                'call' => [
                    'id' => $call->id,
                    'incident_id' => $call->incident_id,
                    'channel_name' => $call->channel_name,
                    'admin_caller' => [
                        'id' => $call->receiver->id,
                        'name' => $call->receiver->name,
                    ],
                    'status' => $call->status,
                    'started_at' => $call->started_at->toIso8601String(),
                    'answered_at' => $call->answered_at->toIso8601String(),
                ],
                'channel_name' => $call->channel_name,
                'agora_app_id' => config('services.agora.app_id'),
                'message' => 'Call answered successfully.',
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to answer admin-initiated call', [
                'error' => $e->getMessage(),
                'user_id' => $user?->id,
                'call_id' => $validated['call_id'] ?? null,
            ]);

            return response()->json([
                'message' => 'An error occurred while answering the call.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Reject an admin-initiated call.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject(Request $request)
    {
        try {
            $user = $request->user();

            // Validate request
            $validated = $request->validate([
                'call_id' => 'required|exists:calls,id',
            ]);

            $call = Call::find($validated['call_id']);

            if (! $call) {
                return response()->json([
                    'message' => 'Call not found.',
                ], 404);
            }

            // Verify the call belongs to the authenticated user
            if ($call->user_id !== $user->id) {
                Log::warning('[CALLS] Unauthorized attempt to reject call', [
                    'call_id' => $call->id,
                    'user_id' => $user->id,
                    'call_user_id' => $call->user_id,
                ]);

                return response()->json([
                    'message' => 'Unauthorized. This call does not belong to you.',
                ], 403);
            }

            // End the call
            $call->update([
                'status' => 'ended',
                'ended_at' => now(),
            ]);

            Log::info('[CALLS] Community user rejected admin-initiated call', [
                'call_id' => $call->id,
                'user_id' => $user->id,
                'admin_id' => $call->receiver_admin_id,
                'ended_at' => $call->ended_at->toIso8601String(),
            ]);

            return response()->json([
                'message' => 'Call rejected successfully.',
            ], 200);

        } catch (\Exception $e) {
            Log::error('[CALLS] Failed to reject admin-initiated call', [
                'error' => $e->getMessage(),
                'user_id' => $user?->id,
                'call_id' => $validated['call_id'] ?? null,
            ]);

            return response()->json([
                'message' => 'An error occurred while rejecting the call.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Format call for API response.
     */
    private function formatCall(Call $call): array
    {
        return [
            'id' => $call->id,
            'user_id' => $call->user_id,
            'incident_id' => $call->incident_id,
            'channel_name' => $call->channel_name,
            'status' => $call->status,
            'started_at' => $call->started_at?->toIso8601String(),
            'ended_at' => $call->ended_at?->toIso8601String(),
        ];
    }
}
