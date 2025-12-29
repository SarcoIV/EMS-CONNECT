# CRITICAL FIX: Incoming Call Screen Not Showing Answer/Deny Buttons

## Current Problem

When admin initiates a call:
- ✅ App detects the call (switches from "message" to "home" tab)
- ❌ Incoming call screen with Answer/Deny buttons does NOT appear
- ✅ Backend is working correctly
- ✅ Admin side Agora connection works

## Root Cause

The polling callback is **switching tabs** instead of **navigating to the incoming call screen**.

---

## Fix Required (3 Steps)

### Step 1: Fix Polling Callback (CRITICAL)

**Find the polling callback** in your code (likely in `App.tsx` or main app component):

**Current WRONG code:**
```typescript
IncomingCallService.setIncomingCallCallback((call, agoraAppId) => {
  setSelectedTab(0);  // ← WRONG: Just switches tab, doesn't show call screen
});
```

**Fix to:**
```typescript
IncomingCallService.setIncomingCallCallback((call, agoraAppId) => {
  console.log('[DEBUG] Incoming call detected, navigating to screen');
  console.log('[DEBUG] Call ID:', call.id);
  console.log('[DEBUG] Admin:', call.admin_caller.name);

  // Navigate to full-screen incoming call screen
  navigation.navigate('IncomingCall', {
    call: call,
    agoraAppId: agoraAppId
  });
});
```

---

### Step 2: Create IncomingCallScreen Component

**Create file**: `screens/IncomingCallScreen.tsx` (or `.jsx` if using JavaScript)

**Complete implementation:**

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your polling service (adjust path as needed)
import IncomingCallService from '../services/IncomingCallService';

const API_BASE_URL = 'https://emsconnect.online';

export default function IncomingCallScreen({ route, navigation }) {
  const { call, agoraAppId } = route.params;

  const [isAnswering, setIsAnswering] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAnswer = async () => {
    setIsAnswering(true);

    try {
      console.log('[CALLS] User tapped Answer, calling API...');

      const token = await AsyncStorage.getItem('auth_token');

      // Call answer API
      const response = await fetch(`${API_BASE_URL}/api/call/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          call_id: call.id,
        }),
      });

      const data = await response.json();
      console.log('[CALLS] Answer API response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to answer call');
      }

      // Navigate to active call screen
      navigation.replace('ActiveCall', {
        call: data.call,
        channelName: data.channel_name,
        agoraAppId: data.agora_app_id,
      });

    } catch (error) {
      console.error('[CALLS] Answer error:', error);
      Alert.alert('Error', 'Failed to answer call. Please try again.');
      setIsAnswering(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);

    try {
      console.log('[CALLS] User tapped Reject, calling API...');

      const token = await AsyncStorage.getItem('auth_token');

      // Call reject API
      const response = await fetch(`${API_BASE_URL}/api/call/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: call.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject call');
      }

      console.log('[CALLS] Call rejected successfully');

      // Go back to previous screen
      navigation.goBack();

      // Resume polling for new incoming calls
      IncomingCallService.startPolling();

    } catch (error) {
      console.error('[CALLS] Reject error:', error);
      Alert.alert('Error', 'Failed to reject call');
      setIsRejecting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Admin Avatar (first letter of name) */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {call.admin_caller.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Admin Name */}
      <Text style={styles.adminName}>{call.admin_caller.name}</Text>
      <Text style={styles.subtitle}>is calling you</Text>

      {/* Incident Context (if available) */}
      {call.incident && (
        <View style={styles.incidentCard}>
          <Text style={styles.incidentLabel}>Incident #{call.incident.id}</Text>
          <Text style={styles.incidentType}>Type: {call.incident.type}</Text>
          {call.incident.location && (
            <Text style={styles.incidentLocation}>{call.incident.location}</Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {/* Answer Button */}
        <TouchableOpacity
          style={[styles.button, styles.answerButton]}
          onPress={handleAnswer}
          disabled={isAnswering || isRejecting}
        >
          {isAnswering ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>✓</Text>
              <Text style={styles.buttonText}>Answer</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Reject Button */}
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={handleReject}
          disabled={isAnswering || isRejecting}
        >
          {isRejecting ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>✗</Text>
              <Text style={styles.buttonText}>Reject</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatarContainer: {
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4a69bd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  adminName: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 40,
  },
  incidentCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    width: '100%',
  },
  incidentLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  incidentType: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  incidentLocation: {
    fontSize: 14,
    color: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerButton: {
    backgroundColor: '#27ae60',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  buttonIcon: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 4,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
```

---

### Step 3: Register Screen in Navigation Stack

**In your navigator** (App.tsx or AppNavigator.tsx):

```typescript
// Import the screen
import IncomingCallScreen from './screens/IncomingCallScreen';

// Inside your Stack.Navigator:
<Stack.Navigator>
  {/* Your existing screens */}
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen name="Messages" component={MessagesScreen} />

  {/* ADD THIS SCREEN: */}
  <Stack.Screen
    name="IncomingCall"
    component={IncomingCallScreen}
    options={{
      headerShown: false,
      presentation: 'fullScreenModal',  // Makes it full screen and modal
      gestureEnabled: false,  // Prevent swipe to dismiss
    }}
  />

  {/* Also add ActiveCall screen if not already there: */}
  <Stack.Screen
    name="ActiveCall"
    component={ActiveCallScreen}  // Create this next
    options={{
      headerShown: false,
      presentation: 'fullScreenModal',
      gestureEnabled: false,
    }}
  />
</Stack.Navigator>
```

---

## Testing & Verification

### Step 1: Add Debug Logs

Add these debug logs to verify everything is working:

```typescript
// In polling callback
IncomingCallService.setIncomingCallCallback((call, agoraAppId) => {
  console.log('[DEBUG] ===== CALLBACK TRIGGERED =====');
  console.log('[DEBUG] Call ID:', call.id);
  console.log('[DEBUG] Admin name:', call.admin_caller.name);
  console.log('[DEBUG] Agora App ID:', agoraAppId);
  console.log('[DEBUG] About to navigate...');

  navigation.navigate('IncomingCall', { call, agoraAppId });

  console.log('[DEBUG] Navigation executed');
});
```

### Step 2: Test Flow

1. **Have admin initiate call** from web dashboard
2. **Watch console** - you should see:
   ```
   [CALLS] Polling...
   [CALLS] 🔔 INCOMING CALL DETECTED!
   [DEBUG] ===== CALLBACK TRIGGERED =====
   [DEBUG] Call ID: 123
   [DEBUG] Admin name: Admin User
   [DEBUG] About to navigate...
   [DEBUG] Navigation executed
   ```
3. **Incoming call screen should appear** within 3 seconds
4. **Tap Answer** → Should navigate to ActiveCall screen
5. **Tap Reject** → Should dismiss and resume polling

### Step 3: Verify Navigation Stack

Check that IncomingCall is registered:

```typescript
// In any component, add this log:
console.log('[DEBUG] Navigation routes:', navigation.getState().routeNames);

// Should output: ['Home', 'Messages', 'IncomingCall', 'ActiveCall', ...]
```

---

## Expected Behavior After Fix

1. ✅ Admin clicks call button on web dashboard
2. ✅ Within 3 seconds, **full-screen incoming call modal appears** on mobile
3. ✅ Shows admin name (e.g., "Admin User")
4. ✅ Shows "is calling you" subtitle
5. ✅ Shows incident details if available
6. ✅ Shows two large buttons: **Answer** (green) and **Reject** (red)
7. ✅ Tapping **Answer** navigates to active call screen
8. ✅ Tapping **Reject** dismisses modal and resumes polling

---

## Troubleshooting

### Issue: Screen still doesn't appear

**Check:**
1. Is IncomingCall registered in Stack.Navigator?
2. Is callback actually being called? (check console logs)
3. Is navigation prop available in callback context?

**Fix:**
```typescript
// If navigation is undefined, you may need to use a ref
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';

const navigationRef = useNavigationContainerRef();

// Use navigationRef.navigate() in callback
IncomingCallService.setIncomingCallCallback((call, agoraAppId) => {
  navigationRef.current?.navigate('IncomingCall', { call, agoraAppId });
});
```

### Issue: Screen appears but crashes

**Check:**
- Missing imports (IncomingCallService, AsyncStorage)
- Route params structure (call.admin_caller.name exists?)
- API_BASE_URL is correct

**Fix:**
Add null checks:
```typescript
<Text>{call?.admin_caller?.name || 'Unknown Admin'}</Text>
```

---

## API Endpoints (Already Working)

These endpoints are verified working on backend:

- `GET /api/call/incoming` - Returns incoming call data
- `POST /api/call/answer` - Answers the call
- `POST /api/call/reject` - Rejects the call

**Expected response from `/api/call/incoming`:**
```json
{
  "has_incoming_call": true,
  "call": {
    "id": 123,
    "channel_name": "emergency_call_admin_1_1767002761",
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
    "started_at": "2025-12-27T18:06:02Z"
  },
  "agora_app_id": "c81a013cd0db4defabcbdb7d005fe627"
}
```

---

## Summary

**What's wrong:** Polling callback just switches tabs instead of showing full-screen modal

**What to fix:**
1. Change callback to use `navigation.navigate('IncomingCall')`
2. Create IncomingCallScreen component
3. Register screen in navigation stack

**Estimated time:** 30-45 minutes

**Result:** Full-screen incoming call modal with Answer/Reject buttons appears when admin calls

---

## Additional Notes

- Admin side is **working correctly** (verified)
- Backend API is **working correctly** (verified)
- Polling is **working** (app detects calls)
- The ONLY issue is the UI navigation/display

After this fix, the full call flow will work end-to-end!
