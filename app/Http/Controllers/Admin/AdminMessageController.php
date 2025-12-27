<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\Message;
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
     * Get all conversations (incidents with messages).
     */
    public function getConversations(Request $request)
    {
        try {
            // Get all incidents that have messages
            $conversations = Incident::whereHas('messages')
                ->with([
                    'user:id,name,email',
                    'messages' => function ($query) {
                        $query->latest()->limit(1); // Get last message
                    },
                    'messages.sender:id,name',
                ])
                ->withCount(['messages as unread_count' => function ($query) {
                    $query->where('is_read', false)
                        ->whereHas('sender', function ($q) {
                            $q->where('role', 'community');
                        });
                }])
                ->orderByDesc('updated_at')
                ->get()
                ->map(function ($incident) {
                    $lastMessage = $incident->messages->first();

                    return [
                        'id' => $incident->id,
                        'incident_id' => $incident->id,
                        'user' => [
                            'id' => $incident->user->id,
                            'name' => $incident->user->name,
                            'email' => $incident->user->email,
                        ],
                        'incident_type' => $incident->type,
                        'incident_status' => $incident->status,
                        'last_message' => $lastMessage ? [
                            'message' => $lastMessage->message,
                            'image_url' => $lastMessage->image_url,
                            'created_at' => $lastMessage->created_at->toIso8601String(),
                            'sender_name' => $lastMessage->sender->name,
                        ] : null,
                        'unread_count' => $incident->unread_count,
                        'updated_at' => $incident->updated_at->toIso8601String(),
                    ];
                });

            return response()->json([
                'conversations' => $conversations,
            ]);
        } catch (\Exception $e) {
            Log::error('[ADMIN MESSAGES] Failed to fetch conversations', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch conversations',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get messages for a specific incident.
     */
    public function getMessages(Request $request, int $incidentId)
    {
        try {
            $perPage = $request->input('per_page', 50);

            $incident = Incident::with('user:id,name,email')->find($incidentId);

            if (! $incident) {
                return response()->json(['message' => 'Incident not found'], 404);
            }

            $messages = Message::where('incident_id', $incidentId)
                ->with('sender:id,name,role,user_role')
                ->orderBy('created_at', 'asc')
                ->paginate($perPage);

            $formattedMessages = $messages->map(fn ($msg) => $msg->toApiResponse());

            return response()->json([
                'incident' => [
                    'id' => $incident->id,
                    'type' => $incident->type,
                    'status' => $incident->status,
                    'user' => $incident->user,
                ],
                'messages' => $formattedMessages,
                'pagination' => [
                    'current_page' => $messages->currentPage(),
                    'last_page' => $messages->lastPage(),
                    'per_page' => $messages->perPage(),
                    'total' => $messages->total(),
                ],
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
     * Send a message from admin.
     */
    public function sendMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'incident_id' => ['required', 'integer', 'exists:incidents,id'],
            'message' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:5120'],
        ], [
            'incident_id.required' => 'Incident ID is required.',
            'incident_id.exists' => 'The specified incident does not exist.',
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
            $user = $request->user();
            $incidentId = $request->incident_id;

            // Require at least one content type
            if (empty($request->message) && ! $request->hasFile('image')) {
                return response()->json([
                    'message' => 'Message or image is required.',
                    'errors' => ['message' => ['You must provide either a text message or an image.']],
                ], 422);
            }

            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time().'_'.uniqid().'.'.$image->getClientOriginalExtension();
                $imagePath = $image->storeAs("messages/{$incidentId}", $filename, 'public');

                if (! $imagePath) {
                    throw new \Exception('Failed to upload image');
                }
            }

            // Create message
            $message = Message::create([
                'incident_id' => $incidentId,
                'sender_id' => $user->id,
                'message' => $request->message,
                'image_path' => $imagePath,
                'is_read' => false,
            ]);

            $message->load('sender:id,name,role,user_role');

            Log::info('[ADMIN MESSAGES] 💬 Admin sent message', [
                'message_id' => $message->id,
                'incident_id' => $incidentId,
                'admin_id' => $user->id,
                'admin_name' => $user->name,
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
     * Mark messages in a conversation as read.
     */
    public function markConversationAsRead(Request $request, int $incidentId)
    {
        try {
            $user = $request->user();

            // Mark all unread messages from community users in this incident as read
            $updated = Message::where('incident_id', $incidentId)
                ->where('sender_id', '!=', $user->id)
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
