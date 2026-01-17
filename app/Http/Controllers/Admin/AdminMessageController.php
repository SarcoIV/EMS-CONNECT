<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AdminMessageController extends Controller
{
    /**
     * Display the chat interface.
     */
    public function index(Request $request)
    {
        return Inertia::render('Admin/Chats', [
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
        ]);
    }

    /**
     * Get all conversations grouped by user (not by incident).
     * All messages from the same user across all their incidents are in one conversation.
     */
    public function getConversations(Request $request)
    {
        try {
            // Get all users who have incidents with messages (community users)
            $usersWithMessages = User::where('role', 'community')
                ->whereHas('incidents', function ($query) {
                    $query->whereHas('messages');
                })
                ->with([
                    'incidents' => function ($query) {
                        $query->whereHas('messages')
                            ->with(['messages' => function ($q) {
                                $q->latest()->limit(1);
                            }, 'messages.sender:id,name'])
                            ->orderByDesc('updated_at');
                    },
                ])
                ->get();

            $conversations = $usersWithMessages->map(function ($user) {
                // Get the most recent incident with messages
                $latestIncident = $user->incidents->first();

                // Get the last message across ALL user's incidents
                $lastMessage = Message::whereIn('incident_id', $user->incidents->pluck('id'))
                    ->with('sender:id,name')
                    ->latest()
                    ->first();

                // Count unread messages across ALL user's incidents
                $unreadCount = Message::whereIn('incident_id', $user->incidents->pluck('id'))
                    ->where('is_read', false)
                    ->whereHas('sender', function ($q) {
                        $q->where('role', 'community');
                    })
                    ->count();

                // Get the latest updated_at from all incidents
                $latestUpdate = $user->incidents->max('updated_at');

                return [
                    'id' => $user->id, // Use user ID as conversation ID
                    'user_id' => $user->id,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'incident_type' => $latestIncident?->type ?? 'other',
                    'incident_status' => $latestIncident?->status ?? 'pending',
                    'incident_count' => $user->incidents->count(),
                    'last_message' => $lastMessage ? [
                        'message' => $lastMessage->message,
                        'image_url' => $lastMessage->image_url,
                        'created_at' => $lastMessage->created_at->toIso8601String(),
                        'sender_name' => $lastMessage->sender->name,
                    ] : null,
                    'unread_count' => $unreadCount,
                    'updated_at' => $latestUpdate?->toIso8601String() ?? now()->toIso8601String(),
                ];
            })
                ->sortByDesc('updated_at')
                ->values();

            return response()->json([
                'conversations' => $conversations,
            ]);
        } catch (\Exception $e) {
            Log::error('[ADMIN MESSAGES] Failed to fetch conversations', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch conversations',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all messages for a specific user (across all their incidents).
     */
    public function getMessages(Request $request, int $userId)
    {
        try {
            $user = User::find($userId);

            if (! $user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            // Get all incident IDs for this user
            $incidentIds = Incident::where('user_id', $userId)->pluck('id');

            if ($incidentIds->isEmpty()) {
                return response()->json([
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'messages' => [],
                    'incidents' => [],
                ]);
            }

            // Get all messages from all incidents for this user
            $messages = Message::whereIn('incident_id', $incidentIds)
                ->with(['sender:id,name,role,user_role', 'incident:id,type,status'])
                ->orderBy('created_at', 'asc')
                ->get();

            $formattedMessages = $messages->map(fn ($msg) => $msg->toApiResponse());

            // Get incident info for reference
            $incidents = Incident::whereIn('id', $incidentIds)
                ->select('id', 'type', 'status', 'created_at')
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'messages' => $formattedMessages,
                'incidents' => $incidents,
                'latest_incident_id' => $incidents->first()?->id,
            ]);
        } catch (\Exception $e) {
            Log::error('[ADMIN MESSAGES] Failed to fetch messages', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch messages',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Send a message from admin to a user.
     * Attaches to the user's most recent active incident.
     */
    public function sendMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'message' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:5120'],
        ], [
            'user_id.required' => 'User ID is required.',
            'user_id.exists' => 'The specified user does not exist.',
            'message.max' => 'Message cannot exceed 2000 characters.',
            'image.image' => 'The file must be an image.',
            'image.mimes' => 'Only JPEG, JPG, and PNG images are allowed.',
            'image.max' => 'Image size cannot exceed 5MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $admin = $request->user();
            $targetUserId = $request->user_id;

            // Require at least one content type
            if (empty($request->message) && ! $request->hasFile('image')) {
                return response()->json([
                    'message' => 'Message or image is required.',
                    'errors' => ['message' => ['You must provide either a text message or an image.']],
                ], 422);
            }

            // Find the user's most recent incident (prefer active ones)
            $incident = Incident::where('user_id', $targetUserId)
                ->orderByRaw("CASE WHEN status IN ('pending', 'dispatched') THEN 0 ELSE 1 END")
                ->orderByDesc('created_at')
                ->first();

            if (! $incident) {
                return response()->json([
                    'message' => 'User has no incidents to send messages to.',
                ], 404);
            }

            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time().'_'.uniqid().'.'.$image->getClientOriginalExtension();
                $imagePath = $image->storeAs("messages/{$incident->id}", $filename, 'public');

                if (! $imagePath) {
                    throw new \Exception('Failed to upload image');
                }
            }

            // Create message
            $message = Message::create([
                'incident_id' => $incident->id,
                'sender_id' => $admin->id,
                'message' => $request->message,
                'image_path' => $imagePath,
                'is_read' => false,
            ]);

            $message->load('sender:id,name,role,user_role');

            Log::info('[ADMIN MESSAGES] 💬 Admin sent message', [
                'message_id' => $message->id,
                'incident_id' => $incident->id,
                'target_user_id' => $targetUserId,
                'admin_id' => $admin->id,
                'admin_name' => $admin->name,
                'has_text' => ! empty($request->message),
                'has_image' => ! is_null($imagePath),
            ]);

            return response()->json([
                'message' => 'Message sent successfully.',
                'data' => $message->toApiResponse(),
            ], 201);

        } catch (\Exception $e) {
            if (isset($imagePath) && $imagePath) {
                Storage::disk('public')->delete($imagePath);
            }

            Log::error('[ADMIN MESSAGES] ❌ Failed to send message', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while sending the message. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Mark all messages from a user as read (across all their incidents).
     */
    public function markConversationAsRead(Request $request, int $userId)
    {
        try {
            $admin = $request->user();

            // Get all incident IDs for this user
            $incidentIds = Incident::where('user_id', $userId)->pluck('id');

            // Mark all unread messages from this user across all their incidents as read
            $updated = Message::whereIn('incident_id', $incidentIds)
                ->where('sender_id', '!=', $admin->id)
                ->where('is_read', false)
                ->whereHas('sender', function ($query) {
                    $query->where('role', 'community');
                })
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'message' => 'Messages marked as read.',
                'updated_count' => $updated,
            ]);
        } catch (\Exception $e) {
            Log::error('[ADMIN MESSAGES] Failed to mark as read', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to mark messages as read',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
