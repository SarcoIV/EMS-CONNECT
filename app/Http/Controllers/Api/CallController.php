<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CallController extends Controller
{
    /**
     * Start a new emergency call.
     *
     * @param Request $request
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
                'errors' => $validator->errors()
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
                    'message' => 'You already have an active call.'
                ], 200);
            }

            // Verify incident belongs to user if incident_id provided
            if ($request->incident_id) {
                $incident = Incident::where('id', $request->incident_id)
                    ->where('user_id', $user->id)
                    ->first();

                if (!$incident) {
                    return response()->json([
                        'message' => 'Incident not found.',
                        'errors' => ['incident_id' => ['The specified incident does not exist or you do not have access to it.']]
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
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * End an active call.
     *
     * @param Request $request
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
                'errors' => $validator->errors()
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

            if (!$call) {
                return response()->json([
                    'message' => 'Call not found.',
                    'errors' => ['call_id' => ['The specified call does not exist or you do not have access to it.']]
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
                    ]
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
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to end call: ' . $e->getMessage());

            return response()->json([
                'message' => 'An error occurred while ending the call. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get active call for authenticated user.
     *
     * @param Request $request
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

            if (!$call) {
                return response()->json([
                    'has_active_call' => false,
                    'call' => null
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
            Log::error('Failed to fetch active call: ' . $e->getMessage());

            return response()->json([
                'message' => 'An error occurred while fetching active call.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get incoming calls for admin (calls with status 'active' waiting for admin).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function incoming(Request $request)
    {
        try {
            $user = $request->user();

            // Only allow admin users to see incoming calls
            if (!$user->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            // Get all calls with 'active' status that haven't been answered yet
            $calls = Call::with(['user:id,name,email,phone_number', 'incident'])
                ->where('status', 'active')
                ->whereNull('receiver_admin_id') // Not yet answered by any admin
                ->orderBy('started_at', 'desc')
                ->get();

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
            Log::error('Failed to fetch incoming calls: ' . $e->getMessage());

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
        $validator = Validator::make($request->all(), [
            'call_id' => ['required', 'integer', 'exists:calls,id'],
        ], [
            'call_id.required' => 'Call ID is required.',
            'call_id.exists' => 'The specified call does not exist.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();

            // Only allow admin users to answer calls
            if (!$user->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $call = Call::with('user:id,name,email,phone_number')
                ->find($request->call_id);

            if (!$call) {
                return response()->json([
                    'message' => 'Call not found.'
                ], 404);
            }

            if ($call->status !== 'active' || $call->receiver_admin_id !== null) {
                return response()->json([
                    'message' => 'Call is not available to answer.',
                    'current_status' => $call->status,
                    'is_answered' => $call->receiver_admin_id !== null
                ], 400);
            }

            // Update call - mark as answered by admin (but keep status as 'active')
            $call->update([
                'receiver_admin_id' => $user->id,
                'answered_at' => now(),
            ]);

            Log::info('Call answered by admin', [
                'call_id' => $call->id,
                'admin_id' => $user->id,
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
                'message' => 'Call answered successfully.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to answer call: ' . $e->getMessage());

            return response()->json([
                'message' => 'An error occurred while answering the call.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Format call for API response.
     *
     * @param Call $call
     * @return array
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

