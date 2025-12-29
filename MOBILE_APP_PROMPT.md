# Mobile App AI Prompt: Admin-Initiated Call Feature

## 🚨 QUICK DIAGNOSIS

### Is Your Mobile App NOT Showing Incoming Calls?

**The problem**: Your app is NOT polling the `/api/call/incoming` endpoint.

**Quick test**:
```bash
# Test if backend is working (replace with your token)
curl -X GET https://emsconnect.online/api/call/incoming \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"

# Expected response (no calls):
# {"has_incoming_call":false,"call":null}

# If you get 200 OK, backend is working!
# If you get 401, your token is invalid
```

**How to verify polling is working in your app**:
1. Add console logs in your polling service
2. You should see logs every 3 seconds: `"[CALLS] Polling..."`
3. If you DON'T see these logs → polling is NOT running

**Still not working?**
- See "Common Mistakes" section below
- Check "Troubleshooting" section at the end
- Read the comprehensive guide: `MOBILE_APP_IMPLEMENTATION_GUIDE.md`

---

## Context
The EMS-CONNECT admin web dashboard can now initiate voice calls to community users directly from the chat interface. Your mobile app needs to support receiving these incoming calls from admins.

**CRITICAL**: The backend is working perfectly. Agora is configured. The ONLY thing missing is your mobile app polling for incoming calls.

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

## ⚠️ COMMON MISTAKES

### Mistake 1: Polling Too Slow
❌ **Bad**: `setInterval(..., 10000)` // 10 seconds - TOO SLOW
✅ **Good**: `setInterval(..., 3000)` // 3 seconds

**Why**: User expects incoming call screen within 3 seconds max.

### Mistake 2: Forgetting to Start Polling on Login
❌ **Bad**:
```javascript
const handleLogin = async () => {
  await loginAPI();
  // Forgot to start polling!
};
```

✅ **Good**:
```javascript
const handleLogin = async () => {
  await loginAPI();
  IncomingCallService.startPolling(); // ← CRITICAL
};
```

### Mistake 3: Not Stopping Polling on Logout
❌ **Bad**: Polling continues after logout → wasted battery and API calls

✅ **Good**:
```javascript
const handleLogout = async () => {
  IncomingCallService.stopPolling(); // ← Stop first
  await logoutAPI();
};
```

### Mistake 4: Not Handling 401 Unauthorized Errors
❌ **Bad**: Ignoring 401 errors → polling continues with invalid token

✅ **Good**:
```javascript
if (error.response?.status === 401) {
  console.error('[CALLS] Token expired');
  IncomingCallService.stopPolling();
  // Force re-login
}
```

### Mistake 5: Polling While Showing Incoming Call Screen
❌ **Bad**: Polling continues even when call screen is showing → multiple callbacks triggered

✅ **Good**:
```javascript
if (data.has_incoming_call) {
  this.stopPolling(); // ← Stop BEFORE showing screen
  showIncomingCallScreen(data.call);
}
```

### Mistake 6: Not Resuming Polling After Call Ends
❌ **Bad**: After rejecting or ending call, polling never resumes → can't receive next call

✅ **Good**:
```javascript
const endCall = async () => {
  await cleanupAgora();
  navigation.goBack();
  IncomingCallService.startPolling(); // ← MUST resume
};

const rejectCall = async () => {
  await rejectAPI();
  navigation.goBack();
  IncomingCallService.startPolling(); // ← MUST resume
};
```

### Mistake 7: Not Requesting Microphone Permissions
❌ **Bad**: Join Agora without checking permissions → silent failure

✅ **Good**:
```javascript
import { PermissionsAndroid, Platform } from 'react-native';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

// Before joining Agora:
const hasPermission = await requestPermissions();
if (!hasPermission) {
  alert('Microphone permission required for calls');
  return;
}
```

### Mistake 8: Hardcoding API URL Without Environment Check
❌ **Bad**:
```javascript
const API_URL = 'http://localhost:8000'; // Won't work on real device!
```

✅ **Good**:
```javascript
const API_URL = __DEV__
  ? 'http://YOUR_LOCAL_IP:8000'  // Development
  : 'https://emsconnect.online';  // Production
```

---

## Future Enhancements (Not Required Now)

These features are planned for future updates but not required for initial implementation:

- Push notifications for incoming calls (instead of polling)
- Call recording capability
- Call history view in mobile app
- Video calling support
- Conference calls (multiple participants)

---

## 🐛 DETAILED TROUBLESHOOTING

### Issue 1: Incoming Call Screen Never Appears

**Symptoms**:
- Admin clicks call button
- Agora logs show connection on web dashboard
- Mobile app shows nothing

**Root Cause**: Mobile app is NOT polling

**Debug Steps**:
1. Check if polling service is running:
   ```javascript
   console.log('[DEBUG] Is polling?', IncomingCallService.isActive());
   ```

2. Add debug logs to polling function:
   ```javascript
   console.log('[DEBUG] Polling iteration at', new Date().toISOString());
   ```

3. Manually test API:
   ```bash
   # Get your token from AsyncStorage
   curl -X GET https://emsconnect.online/api/call/incoming \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json"
   ```

**Solutions**:
- ✅ Verify polling starts on login
- ✅ Check console for polling logs every 3 seconds
- ✅ Verify bearer token is valid
- ✅ Check callback is registered BEFORE starting polling

### Issue 2: "401 Unauthorized" on Polling

**Symptoms**:
- Console shows: `[CALLS] Poll error: 401 Unauthorized`
- Polling stops working

**Root Cause**: Bearer token is invalid, expired, or wrong format

**Debug Steps**:
1. Check token in storage:
   ```javascript
   const token = await AsyncStorage.getItem('auth_token');
   console.log('[DEBUG] Token:', token ? token.substring(0, 20) + '...' : 'NULL');
   ```

2. Verify header format:
   ```javascript
   console.log('[DEBUG] Auth header:', `Bearer ${token}`);
   ```

3. Test token with cURL:
   ```bash
   curl -X GET https://emsconnect.online/api/call/incoming \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Solutions**:
- ✅ Re-login to get fresh token
- ✅ Verify token format: `Bearer <token>` (note the space)
- ✅ Check token is saved correctly after login
- ✅ Ensure user role is 'community' (not 'responder')

### Issue 3: Agora Join Fails

**Symptoms**:
- Incoming call screen appears
- User taps Answer
- Agora error: "Join channel failed"

**Root Cause**: Invalid Agora App ID, wrong channel name, or permissions not granted

**Debug Steps**:
1. Log Agora credentials:
   ```javascript
   console.log('[DEBUG] Agora App ID:', agoraAppId);
   console.log('[DEBUG] Channel Name:', channelName);
   ```

2. Verify credentials format:
   - App ID: 32-character hex string (e.g., `c81a013cd0db4defabcbdb7d005fe627`)
   - Channel: `emergency_call_admin_<id>_<timestamp>`

3. Check microphone permission:
   ```javascript
   const permission = await PermissionsAndroid.check(
     PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
   );
   console.log('[DEBUG] Mic permission:', permission);
   ```

**Solutions**:
- ✅ Request microphone permission BEFORE joining
- ✅ Verify Agora SDK is installed: `npm list react-native-agora`
- ✅ Test with Agora demo app first
- ✅ Check Agora console for app ID validity

### Issue 4: No Audio Between Users

**Symptoms**:
- Call connects successfully
- No audio heard on either side

**Root Cause**: Muted microphone, permission denied, or Agora not configured correctly

**Debug Steps**:
1. Check if muted:
   ```javascript
   console.log('[DEBUG] Is muted?', isMuted);
   ```

2. Verify Agora channel profile:
   ```javascript
   await engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
   ```

3. Check client role:
   ```javascript
   await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
   ```

**Solutions**:
- ✅ Unmute microphone
- ✅ Grant microphone permissions
- ✅ Verify both users are in same channel
- ✅ Test admin speaks first (easier to verify)
- ✅ Check device volume is not zero

### Issue 5: Polling Never Stops (Battery Drain)

**Symptoms**:
- Polling continues even after logout
- Battery drains quickly

**Root Cause**: Forgot to call `stopPolling()` on logout

**Debug Steps**:
1. Add debug log to stopPolling:
   ```javascript
   stopPolling() {
     console.log('[DEBUG] Stopping polling service');
     clearInterval(this.pollIntervalId);
   }
   ```

2. Verify logout calls stopPolling:
   ```javascript
   const handleLogout = async () => {
     console.log('[DEBUG] Logout initiated');
     IncomingCallService.stopPolling();
     // ... rest of logout
   };
   ```

**Solutions**:
- ✅ Always call `stopPolling()` on logout
- ✅ Stop polling when app goes to background (optional)
- ✅ Resume polling when app returns to foreground

### Issue 6: Multiple Incoming Call Screens Appear

**Symptoms**:
- One admin call triggers multiple incoming call screens

**Root Cause**: Callback triggered multiple times because polling didn't stop

**Debug Steps**:
1. Add log when callback is triggered:
   ```javascript
   if (this.onIncomingCallCallback) {
     console.log('[DEBUG] Triggering callback for call', call.id);
     this.onIncomingCallCallback(call, agoraAppId);
   }
   ```

2. Verify polling stops BEFORE callback:
   ```javascript
   if (data.has_incoming_call) {
     this.stopPolling(); // ← MUST be BEFORE callback
     this.onIncomingCallCallback(data.call, data.agora_app_id);
   }
   ```

**Solutions**:
- ✅ Stop polling IMMEDIATELY when call detected
- ✅ Add debounce to callback if needed
- ✅ Check `isPolling` flag before triggering callback

### Issue 7: Polling Doesn't Resume After Call

**Symptoms**:
- First call works fine
- Can't receive second call from admin

**Root Cause**: Forgot to resume polling after ending/rejecting call

**Debug Steps**:
1. Add logs to end call function:
   ```javascript
   const endCall = async () => {
     console.log('[DEBUG] Ending call...');
     await cleanupAgora();
     console.log('[DEBUG] Resuming polling...');
     IncomingCallService.startPolling();
   };
   ```

**Solutions**:
- ✅ Resume polling after endCall()
- ✅ Resume polling after rejectCall()
- ✅ Verify polling service is active after call ends

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
