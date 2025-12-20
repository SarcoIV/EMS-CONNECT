<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Call;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CallsController extends Controller
{
    /**
     * Get incoming calls for admin (calls with status 'calling').
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
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            // Get all calls with 'calling' status
            $calls = Call::with(['caller:id,name,email,phone_number', 'incident'])
                ->where('status', 'calling')
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedCalls = $calls->map(function ($call) {
                return [
                    'id' => $call->id,
                    'incident_id' => $call->incident_id,
                    'channel_name' => $call->channel_name,
                    'caller' => [
                        'id' => $call->caller->id,
                        'name' => $call->caller->name,
                        'email' => $call->caller->email,
                        'phone_number' => $call->caller->phone_number ?? null,
                    ],
                    'status' => $call->status,
                    'created_at' => $call->created_at?->toIso8601String(),
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

            $call = Call::with('caller:id,name,email,phone_number')
                ->find($validated['call_id']);

            if (!$call) {
                return response()->json([
                    'message' => 'Call not found.'
                ], 404);
            }

            if ($call->status !== 'calling') {
                return response()->json([
                    'message' => 'Call is not available to answer.',
                    'current_status' => $call->status
                ], 400);
            }

            // Update call status to answered
            $call->update([
                'status' => 'answered',
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
                        'id' => $call->caller->id,
                        'name' => $call->caller->name,
                        'email' => $call->caller->email,
                        'phone_number' => $call->caller->phone_number ?? null,
                    ],
                    'status' => $call->status,
                    'created_at' => $call->created_at?->toIso8601String(),
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

            Log::info('Call ended by admin', [
                'call_id' => $call->id,
                'admin_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Call ended successfully.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to end call: ' . $e->getMessage());

            return response()->json([
                'message' => 'An error occurred while ending the call.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
