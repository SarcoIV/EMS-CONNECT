# Mobile App AI Prompt: Admin-Initiated Call Feature

## Context
The EMS-CONNECT admin web dashboard can now initiate voice calls to community users directly from the chat interface. Your mobile app needs to support receiving these incoming calls from admins.

## What Changed on Backend

### New API Endpoints Available

#### 1. Poll for Incoming Admin Calls
**Endpoint**: `GET /api/call/incoming`
**Authentication**: Bearer token (community users only)
**Poll Frequency**: Every 2 seconds

**Response when there's an incoming call**:
```json
{
  "has_incoming_call": true,
  "call": {
    "id": 789,
    "incident_id": 456,
    "channel_name": "emergency_call_admin_1_1735300000",
    "admin_caller": {
      "id": 1,
      "name": "Admin Name",
      "email": "admin@example.com"
    },
    "incident": {
      "id": 456,
      "type": "medical",
      "location": "123 Main St",
      "description": "Emergency description"
    },
    "started_at": "2025-12-27T10:00:00Z"
  },
  "agora_app_id": "c81a013cd0db4defabcbdb7d005fe627"
}
```

**Response when no incoming calls**:
```json
{
  "has_incoming_call": false,
  "call": null
}
```

#### 2. Answer Incoming Admin Call
**Endpoint**: `POST /api/call/answer`
**Authentication**: Bearer token

**Request**:
```json
{
  "call_id": 789
}
```

**Response (200 OK)**:
```json
{
  "call": {
    "id": 789,
    "incident_id": 456,
    "channel_name": "emergency_call_admin_1_1735300000",
    "admin_caller": {
      "id": 1,
      "name": "Admin Name"
    },
    "status": "active",
    "started_at": "2025-12-27T10:00:00Z",
    "answered_at": "2025-12-27T10:00:15Z"
  },
  "channel_name": "emergency_call_admin_1_1735300000",
  "agora_app_id": "c81a013cd0db4defabcbdb7d005fe627",
  "message": "Call answered successfully."
}
```

#### 3. Reject Incoming Admin Call
**Endpoint**: `POST /api/call/reject`
**Authentication**: Bearer token

**Request**:
```json
{
  "call_id": 789
}
```

**Response (200 OK)**:
```json
{
  "message": "Call rejected successfully."
}
```

---

## Implementation Requirements for Mobile App

### 1. Add Background Polling Service

Create a background service that polls for incoming admin calls every 3 seconds when the user is logged in.

**Pseudocode**:
```javascript
// Start polling when user logs in
function startIncomingCallPolling() {
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/call/incoming`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (data.has_incoming_call) {
                // Show incoming call screen
                showIncomingAdminCallScreen(data.call);

                // Stop polling while call screen is active
                clearInterval(pollInterval);
            }
        } catch (error) {
            console.error('[CALLS] Polling error:', error);
        }
    }, 3000); // Poll every 3 seconds

    // Store interval ID for cleanup
    return pollInterval;
}

// Stop polling when user logs out
function stopIncomingCallPolling(intervalId) {
    clearInterval(intervalId);
}
```

---

### 2. Create Incoming Admin Call Screen

Design a fullscreen UI that displays when an admin initiates a call.

**Required UI Elements**:
- Admin caller name (from `call.admin_caller.name`)
- Admin avatar/initial
- Incident context (from `call.incident.type` and `call.incident_id`)
- Two buttons:
  - **Answer** (green button)
  - **Reject** (red button)

**Example UI Structure**:
```
┌─────────────────────────────┐
│                             │
│      [Admin Avatar]         │
│                             │
│   Admin Name                │
│   "is calling you"          │
│                             │
│   Incident #456             │
│   Type: Medical             │
│                             │
│  ┌──────┐      ┌──────┐    │
│  │Answer│      │Reject│    │
│  │ (✓) │      │ (✗)  │    │
│  └──────┘      └──────┘    │
│                             │
└─────────────────────────────┘
```

---

### 3. Implement Answer Call Flow

When user taps "Answer" button:

**Step 1: Call API to answer**
```javascript
async function answerAdminCall(callId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/call/answer`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                call_id: callId
            })
        });

        const data = await response.json();

        // Extract Agora credentials
        const { channel_name, agora_app_id } = data;

        // Join Agora channel
        await joinAgoraVoiceChannel(agora_app_id, channel_name);

        // Show in-call UI
        showInCallScreen(data.call);

    } catch (error) {
        console.error('[CALLS] Failed to answer call:', error);
        alert('Failed to answer call. Please try again.');
    }
}
```

**Step 2: Join Agora RTC Channel**

Use Agora React Native SDK (or native SDK):

```javascript
import AgoraRTC from 'agora-rtc-react-native'; // or native SDK

async function joinAgoraVoiceChannel(appId, channelName) {
    try {
        // Initialize Agora engine
        await AgoraRTC.initialize({
            appId: appId
        });

        // Enable audio
        await AgoraRTC.enableAudio();

        // Join channel
        await AgoraRTC.joinChannel(channelName, null, 0);

        console.log('[CALLS] Joined Agora channel:', channelName);

    } catch (error) {
        console.error('[CALLS] Agora join error:', error);
        throw error;
    }
}
```

**Step 3: Show In-Call UI**

Display active call screen with:
- Admin name
- Call duration timer
- Mute/unmute button
- End call button

---

### 4. Implement Reject Call Flow

When user taps "Reject" button:

```javascript
async function rejectAdminCall(callId) {
    try {
        await fetch(`${API_BASE_URL}/api/call/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                call_id: callId
            })
        });

        // Dismiss incoming call screen
        dismissIncomingCallScreen();

        // Resume polling for incoming calls
        startIncomingCallPolling();

    } catch (error) {
        console.error('[CALLS] Failed to reject call:', error);
    }
}
```

---

### 5. Implement End Call Flow

When user taps "End Call" button during active call:

```javascript
async function endCall(callId) {
    try {
        // Call backend to end call
        await fetch(`${API_BASE_URL}/api/call/end`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                call_id: callId
            })
        });

        // Leave Agora channel
        await AgoraRTC.leaveChannel();
        await AgoraRTC.destroy();

        // Dismiss in-call screen
        dismissInCallScreen();

        // Resume polling for incoming calls
        startIncomingCallPolling();

    } catch (error) {
        console.error('[CALLS] Failed to end call:', error);
    }
}
```

---

### 6. Add In-Call Features

#### Mute/Unmute Microphone
```javascript
async function toggleMute() {
    if (isMuted) {
        await AgoraRTC.unmuteLocalAudioStream();
        setIsMuted(false);
    } else {
        await AgoraRTC.muteLocalAudioStream();
        setIsMuted(true);
    }
}
```

#### Call Duration Timer
```javascript
function startCallDurationTimer(answeredAt) {
    const interval = setInterval(() => {
        const now = new Date();
        const answered = new Date(answeredAt);
        const durationInSeconds = Math.floor((now - answered) / 1000);

        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;

        updateCallDurationDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return interval;
}
```

---

## Configuration Required

### 1. Agora SDK Installation

**For React Native**:
```bash
npm install agora-rtc-react-native
```

**For Native iOS**:
```ruby
# In Podfile
pod 'AgoraRtcEngine_iOS'
```

**For Native Android**:
```gradle
// In build.gradle
implementation 'io.agora.rtc:full-sdk:4.x.x'
```

### 2. Permissions

**iOS (Info.plist)**:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone for voice calls with emergency responders</string>
```

**Android (AndroidManifest.xml)**:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

### 3. Environment Variables

Add to your mobile app config:
```javascript
const API_BASE_URL = "https://your-ems-backend.com"; // Your Laravel backend URL
const AGORA_APP_ID = "c81a013cd0db4defabcbdb7d005fe627"; // Provided in API responses
```

---

## Testing Checklist

- [ ] Polling service starts when user logs in
- [ ] Polling stops when user logs out
- [ ] Incoming call screen appears when admin calls
- [ ] Admin name and incident details display correctly
- [ ] Answer button calls API and joins Agora channel
- [ ] Audio connection established with admin
- [ ] Reject button ends call and dismisses screen
- [ ] In-call UI shows call duration
- [ ] Mute button works (admin can't hear user when muted)
- [ ] End call button properly cleans up Agora resources
- [ ] Polling resumes after call ends
- [ ] Handles network errors gracefully
- [ ] Requests microphone permissions before joining call

---

## Important Notes

### Call Behavior
- **No Timeout**: Calls do not automatically timeout. Admin must manually end unanswered calls.
- **Single Call**: Users can only be in one call at a time. Backend prevents simultaneous calls.
- **Incident Context**: Calls are linked to incidents for context and history.

### Polling Best Practices
- Only poll when app is in foreground and user is logged in
- Stop polling when incoming call screen is shown
- Resume polling after call ends (answered or rejected)
- Handle network errors gracefully (don't show errors, just retry next poll)

### Agora Integration
- Use the same Agora App ID provided in API responses
- Channel names are unique per call: `emergency_call_admin_{admin_id}_{timestamp}`
- Audio only (no video) to conserve bandwidth
- Use RTC mode (not broadcast mode)

### Error Handling
- If answer API fails, show error and allow retry
- If Agora join fails, end call via API and show error message
- If network disconnects during call, attempt to rejoin or end gracefully

---

## Future Enhancements (Not Required Now)

These features are planned for future updates but not required for initial implementation:

- Push notifications for incoming calls (instead of polling)
- Call recording capability
- Call history view in mobile app
- Video calling support
- Conference calls (multiple participants)

---

## Support

If you encounter issues during implementation:

1. Check Laravel logs on backend: `php artisan pail`
2. Verify API responses with Postman/curl
3. Test Agora connection with Agora demo app first
4. Ensure user has `role = 'community'` (not responder)
5. Check bearer token is valid and not expired

---

## API Base URL

Replace `API_BASE_URL` in all code examples with your actual backend URL:
- Development: `http://localhost:8000` or your local IP
- Production: `https://your-production-domain.com`

---

## Example Full Implementation Flow

```javascript
// 1. User logs in → Start polling
const pollIntervalId = startIncomingCallPolling();

// 2. Admin initiates call → Backend creates call record

// 3. Mobile polls → Detects incoming call
// GET /api/call/incoming returns has_incoming_call: true

// 4. Show incoming call screen with admin info

// 5. User taps "Answer"
await answerAdminCall(callId);
// → POST /api/call/answer
// → Join Agora channel
// → Show in-call UI

// 6. User talks with admin
// → Audio transmitted via Agora RTC

// 7. User taps "End Call"
await endCall(callId);
// → POST /api/call/end
// → Leave Agora channel
// → Resume polling

// 8. User logs out → Stop polling
stopIncomingCallPolling(pollIntervalId);
```

---

## Summary

**What you need to implement**:
1. Polling service for incoming admin calls (every 3 seconds)
2. Incoming call screen UI (admin name, incident context, answer/reject buttons)
3. Answer flow (API call + Agora join)
4. Reject flow (API call + dismiss screen)
5. In-call UI (duration timer, mute, end call)
6. End call flow (API call + Agora cleanup)
7. Request microphone permissions

**What's already done on backend**:
- API endpoints for incoming/answer/reject/end
- Admin web interface to initiate calls
- Database schema with call records
- Agora integration

**What you DON'T need to implement yet**:
- Push notifications (using polling for now)
- Call timeout (admin manually ends)
- Video calling
- Call recording

Good luck! 🚀
