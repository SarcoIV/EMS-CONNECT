# Mobile App Implementation Guide: Incoming Admin Calls

## 🚨 CRITICAL: Why Your App Isn't Showing Incoming Calls

The backend is working perfectly. Agora is connecting. But your mobile app is **NOT polling for incoming calls**, so it doesn't know when an admin calls.

**What you MUST implement**: A background service that polls `GET /api/call/incoming` every 3 seconds.

---

## ⚡ Quick Start (5 minutes to understand)

### What's Broken
- ✅ Admin clicks call button (working)
- ✅ Backend creates call record (working)
- ✅ Agora tries to connect (working)
- ❌ **Mobile app shows nothing** ← YOU ARE HERE

### Why It's Broken
- Mobile app is **NOT polling** `/api/call/incoming`
- Without polling, mobile app doesn't know a call exists
- Even though Agora is ready, mobile never joins the channel

### What You Need to Do
1. Add polling service that checks for calls every 3 seconds
2. Show incoming call screen when call detected
3. Join Agora channel when user answers
4. Clean up when call ends

### Estimated Time
- Polling service: 30 minutes
- Incoming call UI: 1 hour
- Agora integration: 1 hour
- Testing: 30 minutes
- **Total: ~3 hours**

---

## 📡 Step 1: Implement Polling Service (CRITICAL)

### Where to Add This Code
Create a new file: `src/services/IncomingCallService.ts` (or `services/CallService.js`)

### Complete Implementation (TypeScript)

```typescript
// src/services/IncomingCallService.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const API_BASE_URL = 'https://emsconnect.online'; // Your production URL
const POLL_INTERVAL = 3000; // 3 seconds

interface IncomingCall {
  id: number;
  incident_id: number | null;
  channel_name: string;
  admin_caller: {
    id: number;
    name: string;
    email: string;
  };
  incident: {
    id: number;
    type: string;
    location: string;
    description: string;
  } | null;
  started_at: string;
}

interface IncomingCallResponse {
  has_incoming_call: boolean;
  call: IncomingCall | null;
  agora_app_id?: string;
}

class IncomingCallService {
  private pollIntervalId: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private onIncomingCallCallback: ((call: IncomingCall, agoraAppId: string) => void) | null = null;

  /**
   * Start polling for incoming admin calls
   * Call this when user logs in
   */
  async startPolling() {
    if (this.isPolling) {
      console.log('[CALLS] Polling already active, skipping...');
      return;
    }

    console.log('[CALLS] Starting incoming call polling service...');
    this.isPolling = true;

    // Poll immediately, then every 3 seconds
    await this.checkForIncomingCalls();

    this.pollIntervalId = setInterval(async () => {
      await this.checkForIncomingCalls();
    }, POLL_INTERVAL);

    console.log('[CALLS] Polling service started successfully');
  }

  /**
   * Stop polling
   * Call this when user logs out or incoming call is detected
   */
  stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    this.isPolling = false;
    console.log('[CALLS] Polling service stopped');
  }

  /**
   * Set callback function to handle incoming calls
   */
  setIncomingCallCallback(callback: (call: IncomingCall, agoraAppId: string) => void) {
    this.onIncomingCallCallback = callback;
  }

  /**
   * Check for incoming admin calls (called every 3 seconds)
   */
  private async checkForIncomingCalls() {
    try {
      // Get bearer token from storage
      const token = await AsyncStorage.getItem('auth_token');

      if (!token) {
        console.log('[CALLS] No auth token found, skipping poll');
        return;
      }

      console.log('[CALLS] Polling for incoming calls...');

      // Call API
      const response = await axios.get<IncomingCallResponse>(
        `${API_BASE_URL}/api/call/incoming`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        }
      );

      console.log('[CALLS] Poll response:', response.data);

      // Check if there's an incoming call
      if (response.data.has_incoming_call && response.data.call) {
        console.log('[CALLS] 🔔 INCOMING CALL DETECTED!', {
          call_id: response.data.call.id,
          admin_name: response.data.call.admin_caller.name,
          incident_id: response.data.call.incident_id,
        });

        // Stop polling while handling incoming call
        this.stopPolling();

        // Trigger callback to show incoming call screen
        if (this.onIncomingCallCallback && response.data.agora_app_id) {
          this.onIncomingCallCallback(response.data.call, response.data.agora_app_id);
        } else {
          console.error('[CALLS] No callback registered or missing Agora app ID!');
        }
      }
    } catch (error: any) {
      // Don't show errors to user during polling (network issues are common)
      if (error.response?.status === 401) {
        console.error('[CALLS] Unauthorized - token may be expired');
        this.stopPolling();
      } else if (error.code === 'ECONNABORTED') {
        console.warn('[CALLS] Poll timeout, will retry next interval');
      } else {
        console.error('[CALLS] Poll error:', error.message);
      }
    }
  }

  /**
   * Check if currently polling
   */
  isActive(): boolean {
    return this.isPolling;
  }
}

// Export singleton instance
export default new IncomingCallService();
```

### JavaScript Version (React Native)

```javascript
// services/IncomingCallService.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://emsconnect.online';
const POLL_INTERVAL = 3000; // 3 seconds

class IncomingCallService {
  constructor() {
    this.pollIntervalId = null;
    this.isPolling = false;
    this.onIncomingCallCallback = null;
  }

  async startPolling() {
    if (this.isPolling) {
      console.log('[CALLS] Polling already active');
      return;
    }

    console.log('[CALLS] Starting polling service...');
    this.isPolling = true;

    await this.checkForIncomingCalls();

    this.pollIntervalId = setInterval(() => {
      this.checkForIncomingCalls();
    }, POLL_INTERVAL);
  }

  stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    this.isPolling = false;
    console.log('[CALLS] Polling stopped');
  }

  setIncomingCallCallback(callback) {
    this.onIncomingCallCallback = callback;
  }

  async checkForIncomingCalls() {
    try {
      const token = await AsyncStorage.getItem('auth_token');

      if (!token) return;

      console.log('[CALLS] Polling...');

      const response = await fetch(`${API_BASE_URL}/api/call/incoming`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.has_incoming_call && data.call) {
        console.log('[CALLS] 🔔 INCOMING CALL!', data.call.admin_caller.name);

        this.stopPolling();

        if (this.onIncomingCallCallback) {
          this.onIncomingCallCallback(data.call, data.agora_app_id);
        }
      }
    } catch (error) {
      console.error('[CALLS] Poll error:', error.message);
    }
  }
}

export default new IncomingCallService();
```

### Integration in App.js / App.tsx

```typescript
// App.tsx (or your main navigation file)

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import IncomingCallService from './services/IncomingCallService';
import { useAuth } from './context/AuthContext'; // Your auth context

function App() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Start polling when user logs in
    if (isAuthenticated && user?.role === 'community') {
      console.log('[APP] User logged in, starting call polling');

      // Set callback to handle incoming calls
      IncomingCallService.setIncomingCallCallback((call, agoraAppId) => {
        console.log('[APP] Incoming call callback triggered');
        // Navigate to incoming call screen
        navigation.navigate('IncomingCall', { call, agoraAppId });
      });

      // Start polling
      IncomingCallService.startPolling();
    } else {
      // Stop polling when user logs out
      IncomingCallService.stopPolling();
    }

    // Cleanup on unmount
    return () => {
      IncomingCallService.stopPolling();
    };
  }, [isAuthenticated, user]);

  return (
    <NavigationContainer>
      {/* Your navigation stack */}
    </NavigationContainer>
  );
}

export default App;
```

### When to Start/Stop Polling

| Event | Action |
|-------|--------|
| ✅ User logs in | Start polling |
| ❌ User logs out | Stop polling |
| 📞 Incoming call detected | Stop polling (resume after call ends) |
| 📱 App goes to background | Stop polling (optional, for battery) |
| 📱 App returns to foreground | Resume polling |

---

## 📱 Step 2: Create Incoming Call Screen

### Screen Component (TypeScript)

```typescript
// screens/IncomingCallScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IncomingCallService from '../services/IncomingCallService';

const API_BASE_URL = 'https://emsconnect.online';

interface Props {
  route: {
    params: {
      call: {
        id: number;
        admin_caller: {
          id: number;
          name: string;
          email: string;
        };
        incident: {
          id: number;
          type: string;
          location: string;
        } | null;
        channel_name: string;
      };
      agoraAppId: string;
    };
  };
  navigation: any;
}

export default function IncomingCallScreen({ route, navigation }: Props) {
  const { call, agoraAppId } = route.params;
  const [isAnswering, setIsAnswering] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAnswer = async () => {
    setIsAnswering(true);

    try {
      console.log('[CALLS] User tapped Answer, calling API...');

      const token = await AsyncStorage.getItem('auth_token');

      // Call answer API
      const response = await axios.post(
        `${API_BASE_URL}/api/call/answer`,
        { call_id: call.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      console.log('[CALLS] Answer API response:', response.data);

      const { channel_name, agora_app_id } = response.data;

      // Navigate to active call screen
      navigation.replace('ActiveCall', {
        call: response.data.call,
        channelName: channel_name,
        agoraAppId: agora_app_id,
      });

    } catch (error: any) {
      console.error('[CALLS] Failed to answer call:', error.response?.data || error.message);
      alert('Failed to answer call. Please try again.');
      setIsAnswering(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);

    try {
      console.log('[CALLS] User tapped Reject, calling API...');

      const token = await AsyncStorage.getItem('auth_token');

      // Call reject API
      await axios.post(
        `${API_BASE_URL}/api/call/reject`,
        { call_id: call.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[CALLS] Call rejected successfully');

      // Go back to previous screen
      navigation.goBack();

      // Resume polling for new calls
      IncomingCallService.startPolling();

    } catch (error: any) {
      console.error('[CALLS] Failed to reject call:', error.message);
      alert('Failed to reject call');
      setIsRejecting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Admin Avatar */}
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

      {/* Incident Context */}
      {call.incident && (
        <View style={styles.incidentCard}>
          <Text style={styles.incidentLabel}>Incident #{call.incident.id}</Text>
          <Text style={styles.incidentType}>Type: {call.incident.type}</Text>
          <Text style={styles.incidentLocation}>{call.incident.location}</Text>
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
            <ActivityIndicator color="#fff" />
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
            <ActivityIndicator color="#fff" />
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

## 🎙️ Step 3: Integrate Agora SDK

### Install Agora SDK

```bash
# React Native
npm install react-native-agora

# Link (for older React Native versions)
npx react-native link react-native-agora
```

### Active Call Screen with Agora

```typescript
// screens/ActiveCallScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import RtcEngine, {
  RtcEngineContext,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IncomingCallService from '../services/IncomingCallService';

const API_BASE_URL = 'https://emsconnect.online';

interface Props {
  route: {
    params: {
      call: any;
      channelName: string;
      agoraAppId: string;
    };
  };
  navigation: any;
}

export default function ActiveCallScreen({ route, navigation }: Props) {
  const { call, channelName, agoraAppId } = route.params;

  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const engineRef = useRef<RtcEngine | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAgora();

    return () => {
      cleanupAgora();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      console.log('[AGORA] Initializing engine...');

      // Create Agora engine
      const engine = await RtcEngine.create(agoraAppId);
      engineRef.current = engine;

      // Enable audio
      await engine.enableAudio();

      // Set channel profile to communication
      await engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);

      // Set client role to broadcaster (for voice calls)
      await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Join channel
      console.log('[AGORA] Joining channel:', channelName);
      await engine.joinChannel(null, channelName, null, 0);

      setIsConnected(true);
      console.log('[AGORA] Joined channel successfully');

      // Start call duration timer
      startDurationTimer();

    } catch (error: any) {
      console.error('[AGORA] Failed to initialize:', error);
      alert('Failed to connect to call. Please try again.');
      navigation.goBack();
    }
  };

  const cleanupAgora = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (engineRef.current) {
        await engineRef.current.leaveChannel();
        await engineRef.current.destroy();
      }
    } catch (error) {
      console.error('[AGORA] Cleanup error:', error);
    }
  };

  const startDurationTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = async () => {
    try {
      if (engineRef.current) {
        await engineRef.current.muteLocalAudioStream(!isMuted);
        setIsMuted(!isMuted);
        console.log('[AGORA] Mute toggled:', !isMuted);
      }
    } catch (error) {
      console.error('[AGORA] Mute error:', error);
    }
  };

  const endCall = async () => {
    setIsEnding(true);

    try {
      console.log('[CALLS] Ending call...');

      const token = await AsyncStorage.getItem('auth_token');

      // Call backend to end call
      await axios.post(
        `${API_BASE_URL}/api/call/end`,
        { call_id: call.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[CALLS] Call ended successfully');

      // Cleanup Agora
      await cleanupAgora();

      // Go back
      navigation.goBack();

      // Resume polling for new calls
      IncomingCallService.startPolling();

    } catch (error: any) {
      console.error('[CALLS] End call error:', error);
      alert('Failed to end call');
      setIsEnding(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Admin Info */}
      <View style={styles.headerContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {call.admin_caller?.name?.charAt(0).toUpperCase() || 'A'}
          </Text>
        </View>
        <Text style={styles.adminName}>{call.admin_caller?.name || 'Admin'}</Text>
        <Text style={styles.status}>
          {isConnected ? formatDuration(duration) : 'Connecting...'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.activeButton]}
          onPress={toggleMute}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endButton]}
          onPress={endCall}
          disabled={isEnding}
        >
          {isEnding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.controlIcon}>📞</Text>
              <Text style={styles.controlLabel}>End Call</Text>
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
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  headerContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a69bd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  adminName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: '#aaa',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 30,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#4a69bd',
  },
  endButton: {
    backgroundColor: '#e74c3c',
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 12,
    color: '#fff',
  },
});
```

---

## ✅ Testing Guide

### Test 1: Verify Polling is Working

1. **Add console logs to track polling**:
   - Run your app in development mode
   - Login as a community user
   - Check console/logs

2. **Expected logs**:
```
[CALLS] Starting incoming call polling service...
[CALLS] Polling service started successfully
[CALLS] Polling for incoming calls...
[CALLS] Poll response: {has_incoming_call: false, call: null}
[CALLS] Polling for incoming calls...
[CALLS] Poll response: {has_incoming_call: false, call: null}
... (repeats every 3 seconds)
```

3. **Have admin initiate call from web dashboard**

4. **Expected logs after admin calls**:
```
[CALLS] Polling for incoming calls...
[CALLS] Poll response: {has_incoming_call: true, call: {...}}
[CALLS] 🔔 INCOMING CALL DETECTED! {call_id: 123, admin_name: "Admin Name", ...}
[CALLS] Polling service stopped
[APP] Incoming call callback triggered
```

### Test 2: Test API Manually (Before Mobile Implementation)

Use cURL or Postman to verify backend is working:

```bash
# 1. Login as community user
curl -X POST https://emsconnect.online/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password"
  }'

# Response: {"user": {...}, "token": "12|abcdef123456..."}

# 2. Save token, then poll for incoming calls
curl -X GET https://emsconnect.online/api/call/incoming \
  -H "Authorization: Bearer 12|abcdef123456..." \
  -H "Accept: application/json"

# Response (no calls): {"has_incoming_call": false, "call": null}

# 3. Have admin initiate call from web dashboard (click phone icon in Chats)

# 4. Poll again - should now return the call
curl -X GET https://emsconnect.online/api/call/incoming \
  -H "Authorization: Bearer 12|abcdef123456..." \
  -H "Accept: application/json"

# Response (call exists):
# {
#   "has_incoming_call": true,
#   "call": {
#     "id": 789,
#     "admin_caller": {"id": 1, "name": "Admin Name", "email": "admin@example.com"},
#     "channel_name": "emergency_call_admin_1_1735300000",
#     "incident_id": 456,
#     "incident": {...},
#     "started_at": "2025-12-27T10:00:00Z"
#   },
#   "agora_app_id": "c81a013cd0db4defabcbdb7d005fe627"
# }

# 5. Answer the call
curl -X POST https://emsconnect.online/api/call/answer \
  -H "Authorization: Bearer 12|abcdef123456..." \
  -H "Content-Type: application/json" \
  -d '{"call_id": 789}'

# Response:
# {
#   "call": {...},
#   "channel_name": "emergency_call_admin_1_1735300000",
#   "agora_app_id": "c81a013cd0db4defabcbdb7d005fe627",
#   "message": "Call answered successfully."
# }
```

### Test 3: End-to-End Call Test

1. **Admin side** (web dashboard):
   - Login as admin
   - Go to Chats page
   - Select a conversation with community user
   - Click phone icon

2. **Mobile side** (your app):
   - Login as community user
   - Wait up to 3 seconds
   - Incoming call screen should appear
   - Should show admin name and incident details

3. **Answer call**:
   - Tap "Answer" button
   - Should navigate to active call screen
   - Agora should connect (check console logs)
   - Both parties should hear each other

4. **Test audio**:
   - Admin speaks → Mobile user hears
   - Mobile user speaks → Admin hears
   - Test mute button (muted user shouldn't be heard)

5. **End call**:
   - Tap "End Call" button
   - Should return to previous screen
   - Polling should resume
   - Call record in database should show status='ended'

---

## 🐛 Troubleshooting

### Problem: "Polling returns 401 Unauthorized"

**Cause**: Bearer token is invalid or expired

**Solution**:
1. Check token in AsyncStorage: `await AsyncStorage.getItem('auth_token')`
2. Verify token format in header: `Authorization: Bearer <token>`
3. Re-login to get fresh token
4. Check if token includes user role (must be 'community')

**Debug code**:
```typescript
const token = await AsyncStorage.getItem('auth_token');
console.log('[DEBUG] Token:', token?.substring(0, 20) + '...');
console.log('[DEBUG] Token length:', token?.length);
```

### Problem: "has_incoming_call always returns false"

**Cause**: Admin hasn't initiated call OR mobile user ID doesn't match

**Solution**:
1. Verify admin clicked call button (check web dashboard console)
2. Check backend logs: `tail -f storage/logs/laravel.log | grep CALL`
3. Verify mobile user's ID matches the user_id admin is calling
4. Check database:
   ```sql
   SELECT * FROM calls WHERE status='active' AND initiator_type='admin' AND answered_at IS NULL;
   ```

### Problem: "Incoming call screen doesn't appear"

**Cause**: Callback not registered or navigation not set up

**Solution**:
1. Verify callback is set before starting polling:
   ```typescript
   IncomingCallService.setIncomingCallCallback((call, agoraAppId) => {
     console.log('[DEBUG] Callback triggered!', call.id);
     navigation.navigate('IncomingCall', { call, agoraAppId });
   });
   ```
2. Check navigation stack includes 'IncomingCall' screen
3. Add debug log in callback to verify it's being called

### Problem: "Agora join fails"

**Cause**: Invalid app ID or channel name

**Solution**:
1. Verify Agora app ID matches backend config
2. Check channel name format: `emergency_call_admin_<admin_id>_<timestamp>`
3. Ensure Agora SDK is properly installed
4. Test with Agora demo app first
5. Check console for Agora error codes

**Debug code**:
```typescript
console.log('[DEBUG] Agora App ID:', agoraAppId);
console.log('[DEBUG] Channel Name:', channelName);
```

### Problem: "No audio between admin and mobile user"

**Cause**: Microphone permissions not granted OR Agora not configured

**Solution**:
1. Request microphone permissions:
   ```typescript
   import { PermissionsAndroid, Platform } from 'react-native';

   if (Platform.OS === 'android') {
     await PermissionsAndroid.request(
       PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
     );
   }
   ```
2. Check Agora logs for connection status
3. Verify both parties are in same channel
4. Test audio with admin speaking first

### Problem: "Polling stops after logout/login"

**Cause**: Polling not restarted on login

**Solution**:
1. Ensure polling starts in login success callback:
   ```typescript
   const handleLogin = async () => {
     // ... login logic
     if (success) {
       IncomingCallService.startPolling();
     }
   };
   ```
2. Stop polling on logout:
   ```typescript
   const handleLogout = async () => {
     IncomingCallService.stopPolling();
     // ... logout logic
   };
   ```

### Problem: "Polling continues after call ends"

**Cause**: Forgot to resume polling after call

**Solution**:
Add polling resume after call end:
```typescript
const endCall = async () => {
  await cleanupAgora();
  navigation.goBack();

  // CRITICAL: Resume polling
  IncomingCallService.startPolling();
};
```

---

## 📊 Architecture Overview

### Component Interaction Diagram

```
┌──────────────┐
│   App.tsx    │
│              │
│ - Listens to │
│   auth state │
│ - Starts     │
│   polling on │
│   login      │
└──────┬───────┘
       │
       │ calls startPolling()
       ↓
┌─────────────────────────┐
│ IncomingCallService     │
│                         │
│ - Polls /api/call/      │
│   incoming every 3s     │
│ - Triggers callback     │
│   when call detected    │
└──────┬──────────────────┘
       │
       │ GET /api/call/incoming
       ↓
┌─────────────────────────┐
│   Backend API           │
│   (Laravel)             │
│                         │
│ - Checks for admin-     │
│   initiated calls       │
│ - Returns call data     │
└──────┬──────────────────┘
       │
       │ has_incoming_call: true
       ↓
┌─────────────────────────┐
│ Callback triggered      │
│                         │
│ navigation.navigate(    │
│   'IncomingCall',       │
│   { call, agoraAppId }  │
│ )                       │
└──────┬──────────────────┘
       │
       ↓
┌─────────────────────────┐
│ IncomingCallScreen      │
│                         │
│ - Shows admin info      │
│ - Answer/Reject buttons │
└──────┬──────────────────┘
       │
       │ User taps "Answer"
       ↓
┌─────────────────────────┐
│ POST /api/call/answer   │
│                         │
│ - Updates answered_at   │
│ - Returns Agora creds   │
└──────┬──────────────────┘
       │
       ↓
┌─────────────────────────┐
│ ActiveCallScreen        │
│                         │
│ - Joins Agora channel   │
│ - Shows call duration   │
│ - Mute/End buttons      │
└─────────────────────────┘
```

### State Flow Diagram

```
[App Launch]
     ↓
[User Login] → [Start Polling] ────┐
                   ↓                │
            [Poll every 3s]         │
                   ↓                │
         [Check for calls]          │
                ↙    ↘              │
           YES        NO             │
            ↓          ↓             │
    [Show Screen] [Continue] ───────┘
            ↓
    [User Answers?]
        ↙    ↘
     YES      NO
      ↓       ↓
  [Join]  [Reject]
   Call      ↓
    ↓    [Dismiss]
[Active]     ↓
   Call   [Resume
    ↓     Polling]
[End Call]
    ↓
[Resume
 Polling]
```

---

## 🎯 Success Criteria

After implementing all steps, you should see:

- ✅ Console logs showing "Polling for incoming calls..." every 3 seconds
- ✅ When admin calls, console logs "🔔 INCOMING CALL DETECTED!"
- ✅ Incoming call screen appears within 3 seconds
- ✅ Screen shows admin name and incident details
- ✅ Tapping "Answer" calls API and joins Agora channel
- ✅ Both admin and mobile user can hear each other
- ✅ Mute button works (muted user not heard)
- ✅ Call duration timer updates every second
- ✅ Tapping "End Call" properly cleans up Agora resources
- ✅ Polling resumes after call ends or is rejected
- ✅ No crashes or memory leaks

---

## 🔐 Permissions Setup

### iOS (Info.plist)

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone for voice calls with emergency responders</string>
```

### Android (AndroidManifest.xml)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application ...>
        ...
    </application>
</manifest>
```

### Request Permissions at Runtime (Android)

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for voice calls',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // iOS handles permission automatically via Info.plist
};
```

---

## 📝 Summary

### What You Need to Implement

1. ✅ **Polling Service** - Background service that checks for calls every 3 seconds
2. ✅ **Incoming Call Screen** - Fullscreen UI with admin name, answer/reject buttons
3. ✅ **Answer Flow** - Call API + Join Agora channel
4. ✅ **Reject Flow** - Call API + Dismiss screen
5. ✅ **Active Call Screen** - Duration timer, mute button, end call button
6. ✅ **Permissions** - Request microphone access
7. ✅ **Cleanup** - Properly leave Agora channel and resume polling

### What's Already Done (Backend)

- ✅ API endpoints (`/api/call/incoming`, `/api/call/answer`, `/api/call/reject`, `/api/call/end`)
- ✅ Admin web interface to initiate calls
- ✅ Database schema with call records
- ✅ Agora integration
- ✅ Comprehensive logging

### What You DON'T Need Yet

- ❌ Push notifications (using polling for now)
- ❌ Call timeout (admin manually ends)
- ❌ Video calling
- ❌ Call recording

---

## 🚀 Next Steps

1. Copy the polling service code to your project
2. Create the incoming call screen
3. Create the active call screen
4. Wire up navigation
5. Test with admin calling from web dashboard
6. Deploy to production

Good luck! 🎉
