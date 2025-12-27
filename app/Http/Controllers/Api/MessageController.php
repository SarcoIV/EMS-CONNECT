<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    /**
     * Send a message for an incident.
     */
    public function store(Request $request)
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

            // Authorization check
            $incident = Incident::find($incidentId);
            if (! $this->canMessageIncident($user, $incident)) {
                return response()->json([
                    'message' => 'Unauthorized.',
                    'errors' => ['incident_id' => ['You do not have permission to message about this incident.']],
                ], 403);
            }

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

            Log::info('[MESSAGES] 💬 New message sent', [
                'message_id' => $message->id,
                'incident_id' => $incidentId,
                'sender_id' => $user->id,
                'sender_name' => $user->name,
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

            Log::error('[MESSAGES] ❌ Failed to send message', [
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
     * Get messages for an incident (paginated).
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'incident_id' => ['required', 'integer', 'exists:incidents,id'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
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
            $perPage = $request->input('per_page', 50);

            $incident = Incident::find($incidentId);
            if (! $this->canMessageIncident($user, $incident)) {
                return response()->json([
                    'message' => 'Unauthorized.',
                ], 403);
            }

            $messages = Message::where('incident_id', $incidentId)
                ->with('sender:id,name,role,user_role')
                ->orderBy('created_at', 'asc')
                ->paginate($perPage);

            $formattedMessages = $messages->map(fn ($msg) => $msg->toApiResponse());

            return response()->json([
                'messages' => $formattedMessages,
                'pagination' => [
                    'current_page' => $messages->currentPage(),
                    'last_page' => $messages->lastPage(),
                    'per_page' => $messages->perPage(),
                    'total' => $messages->total(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('[MESSAGES] Failed to fetch messages', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred while fetching messages.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get unread message count.
     */
    public function unreadCount(Request $request)
    {
        try {
            $user = $request->user();
            $unreadCount = 0;

            if ($user->isCommunity()) {
                $incidentIds = Incident::where('user_id', $user->id)->pluck('id');
                $unreadCount = Message::whereIn('incident_id', $incidentIds)
                    ->where('sender_id', '!=', $user->id)
                    ->where('is_read', false)
                    ->count();

            } elseif ($user->isAdmin()) {
                $unreadCount = Message::whereHas('sender', function ($query) {
                    $query->where('role', 'community');
                })->where('is_read', false)->count();
            }

            return response()->json(['unread_count' => $unreadCount], 200);

        } catch (\Exception $e) {
            Log::error('[MESSAGES] Failed to fetch unread count', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Mark message as read.
     */
    public function markAsRead(Request $request, int $id)
    {
        try {
            $user = $request->user();
            $message = Message::with('incident')->find($id);

            if (! $message) {
                return response()->json([
                    'message' => 'Message not found.',
                ], 404);
            }

            if (! $this->canMessageIncident($user, $message->incident)) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            if ($message->sender_id === $user->id) {
                return response()->json(['message' => 'Cannot mark own message as read.'], 200);
            }

            $message->markAsRead();

            return response()->json([
                'message' => 'Message marked as read.',
                'data' => [
                    'id' => $message->id,
                    'is_read' => $message->is_read,
                    'read_at' => $message->read_at?->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('[MESSAGES] Failed to mark as read', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'An error occurred.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Authorization: Check if user can message about incident.
     */
    private function canMessageIncident($user, $incident): bool
    {
        if (! $incident) {
            return false;
        }
        if ($user->isAdmin()) {
            return true;
        }
        if ($user->isCommunity()) {
            return $incident->user_id === $user->id;
        }

        return false; // Responders cannot message
    }
}
