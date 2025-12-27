# EMS Connect - Mobile App Messaging Integration Guide

> **Version:** 1.0
> **Date:** December 27, 2025
> **Backend API:** Laravel 12 REST API
> **Authentication:** Bearer Token (Sanctum)

---

## Table of Contents
1. [Overview](#overview)
2. [API Configuration](#api-configuration)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Implementation Guide](#implementation-guide)
5. [Code Examples](#code-examples)
6. [UI Components](#ui-components)
7. [Error Handling](#error-handling)
8. [Testing Checklist](#testing-checklist)
9. [Performance Optimization](#performance-optimization)

---

## Overview

### What You're Building
An incident-based messaging system where **community users** can chat with **admins** about specific emergency incidents. Messages support both text and images, with real-time updates via polling.

### Key Features
- ✅ Send text messages
- ✅ Send image attachments (JPG/PNG, max 5MB)
- ✅ Real-time message sync via polling (every 3 seconds)
- ✅ Unread message badge counter
- ✅ Automatic read receipts
- ✅ Message history with pagination
- ✅ Offline handling and retry logic

### Technical Requirements
- **Polling Frequency:** Every 3 seconds when chat screen is active
- **Image Formats:** JPEG, JPG, PNG only
- **Image Size Limit:** 5MB maximum
- **Authentication:** Bearer token in all requests
- **Pagination:** 50 messages per page (default)

---

## API Configuration

### Base URL
```
https://your-api-domain.com/api
```

**Replace with your actual API URL:**
- Production: `https://ems-connect.com/api`
- Staging: `https://staging.ems-connect.com/api`

### Authentication Header
All API requests require authentication:
```
Authorization: Bearer {user_access_token}
```

You receive this token after successful login via:
```
POST /api/auth/login
```

---

## API Endpoints Reference

### 1. Send Message

**Endpoint:** `POST /api/messages`

**Content-Type:** `multipart/form-data`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
Accept: application/json
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `incident_id` | integer | ✅ Yes | The incident ID this message belongs to |
| `message` | string | ⚠️ Optional* | Text message (max 2000 characters) |
| `image` | file | ⚠️ Optional* | Image file (JPG/PNG, max 5MB) |

_*At least one of `message` or `image` must be provided_

**Success Response (201 Created):**
```json
{
  "message": "Message sent successfully.",
  "data": {
    "id": 123,
    "incident_id": 5,
    "sender_id": 1,
    "sender": {
      "id": 1,
      "name": "John Doe",
      "role": "community",
      "user_role": null
    },
    "message": "Help is on the way!",
    "image_url": "http://localhost:8000/storage/messages/5/1735332000_abc123.jpg",
    "is_read": false,
    "read_at": null,
    "created_at": "2025-12-27T14:20:00Z"
  }
}
```

**Error Responses:**

**422 Unprocessable Entity** (Validation Error):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "incident_id": ["Incident ID is required."],
    "image": ["Image size cannot exceed 5MB."],
    "message": ["Message cannot exceed 2000 characters."]
  }
}
```

**403 Forbidden** (Unauthorized):
```json
{
  "message": "Unauthorized.",
  "errors": {
    "incident_id": ["You do not have permission to message about this incident."]
  }
}
```

**401 Unauthorized** (Invalid/Missing Token):
```json
{
  "message": "Unauthenticated."
}
```

---

### 2. Get Messages (Fetch Message History)

**Endpoint:** `GET /api/messages`

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `incident_id` | integer | ✅ Yes | - | Filter messages by incident |
| `page` | integer | ❌ No | 1 | Page number for pagination |
| `per_page` | integer | ❌ No | 50 | Messages per page (10-100) |

**Example Request:**
```
GET /api/messages?incident_id=5&per_page=50&page=1
```

**Success Response (200 OK):**
```json
{
  "messages": [
    {
      "id": 120,
      "incident_id": 5,
      "sender_id": 1,
      "sender": {
        "id": 1,
        "name": "John Doe",
        "role": "community",
        "user_role": null
      },
      "message": "I need help urgently!",
      "image_url": null,
      "is_read": true,
      "read_at": "2025-12-27T14:15:00Z",
      "created_at": "2025-12-27T14:10:00Z"
    },
    {
      "id": 121,
      "incident_id": 5,
      "sender_id": 2,
      "sender": {
        "id": 2,
        "name": "Admin User",
        "role": null,
        "user_role": "admin"
      },
      "message": "Help is on the way!",
      "image_url": null,
      "is_read": false,
      "read_at": null,
      "created_at": "2025-12-27T14:20:00Z"
    },
    {
      "id": 122,
      "incident_id": 5,
      "sender_id": 2,
      "sender": {
        "id": 2,
        "name": "Admin User",
        "role": null,
        "user_role": "admin"
      },
      "message": null,
      "image_url": "http://localhost:8000/storage/messages/5/scene_photo.jpg",
      "is_read": false,
      "read_at": null,
      "created_at": "2025-12-27T14:21:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 50,
    "total": 142
  }
}
```

**Notes:**
- Messages are ordered chronologically (oldest first)
- Both `message` and `image_url` can be present, or just one
- `image_url` will be `null` if no image was uploaded

---

### 3. Get Unread Message Count

**Endpoint:** `GET /api/messages/unread-count`

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Success Response (200 OK):**
```json
{
  "unread_count": 3
}
```

**Description:**
- For **community users**: Counts unread messages in their incidents from admins
- For **admins**: Counts all unread messages from community users
- Use this for displaying a badge on the messages icon

---

### 4. Mark Message as Read

**Endpoint:** `POST /api/messages/{message_id}/mark-read`

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message_id` | integer | ✅ Yes | The ID of the message to mark as read |

**Example Request:**
```
POST /api/messages/123/mark-read
```

**Success Response (200 OK):**
```json
{
  "message": "Message marked as read.",
  "data": {
    "id": 123,
    "is_read": true,
    "read_at": "2025-12-27T14:25:00Z"
  }
}
```

**Notes:**
- Cannot mark your own messages as read (returns 200 but doesn't update)
- Automatically updates `is_read` to `true` and sets `read_at` timestamp

---

## Implementation Guide

### Step 1: Project Setup

#### Install Required Libraries

**For React Native:**
```bash
npm install react-native-image-picker
npm install @react-native-async-storage/async-storage
```

**For Expo:**
```bash
expo install expo-image-picker
expo install @react-native-async-storage/async-storage
```

#### Configuration

**iOS (react-native-image-picker):** Add to `ios/YourApp/Info.plist`:
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to send images</string>
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to take photos</string>
```

**Android (react-native-image-picker):** Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

### Step 2: API Service Setup

Create a centralized API service file.

**File:** `src/services/messageService.js`

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://your-api-domain.com/api'; // Replace with your API URL

/**
 * Get authentication token from storage
 */
async function getAuthToken() {
  const token = await AsyncStorage.getItem('auth_token');
  return token;
}

/**
 * Send a message (text and/or image)
 */
export async function sendMessage(incidentId, messageText, imageFile) {
  const token = await getAuthToken();

  const formData = new FormData();
  formData.append('incident_id', incidentId);

  if (messageText && messageText.trim()) {
    formData.append('message', messageText.trim());
  }

  if (imageFile) {
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.fileName || 'image.jpg',
    });
  }

  const response = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      data: data,
    };
  }

  return data;
}

/**
 * Fetch messages for an incident
 */
export async function fetchMessages(incidentId, page = 1, perPage = 50) {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_URL}/messages?incident_id=${incidentId}&per_page=${perPage}&page=${page}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      data: data,
    };
  }

  return data;
}

/**
 * Get unread message count
 */
export async function getUnreadCount() {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/messages/unread-count`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      data: data,
    };
  }

  return data.unread_count;
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId) {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/messages/${messageId}/mark-read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      data: data,
    };
  }

  return data;
}
```

---

### Step 3: Polling Implementation

**File:** `src/hooks/useMessagePolling.js`

```javascript
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchMessages } from '../services/messageService';

/**
 * Custom hook for polling messages every 3 seconds
 */
export function useMessagePolling(incidentId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const loadMessages = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMessages(incidentId, 1, 50);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError(err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const startPolling = () => {
    // Initial load
    loadMessages();

    // Poll every 3 seconds
    intervalRef.current = setInterval(() => {
      loadMessages(false); // Don't show loader on subsequent polls
    }, 3000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // Start polling when component mounts
    startPolling();

    // Handle app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - resume polling
        console.log('App foregrounded - resuming message polling');
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - stop polling to save battery
        console.log('App backgrounded - stopping message polling');
        stopPolling();
      }

      appState.current = nextAppState;
    });

    // Cleanup on unmount
    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [incidentId]);

  return {
    messages,
    isLoading,
    error,
    refetch: () => loadMessages(true),
  };
}
```

---

### Step 4: Image Picker Implementation

**File:** `src/utils/imagePicker.js`

#### For React Native (react-native-image-picker):

```javascript
import { launchImageLibrary } from 'react-native-image-picker';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export async function pickImage() {
  return new Promise((resolve, reject) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          resolve(null);
        } else if (response.errorCode) {
          reject(new Error(response.errorMessage || 'Image picker error'));
        } else {
          const asset = response.assets[0];

          // Validate file size
          if (asset.fileSize > MAX_IMAGE_SIZE) {
            reject(new Error('Image must be less than 5MB'));
            return;
          }

          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
          if (!allowedTypes.includes(asset.type)) {
            reject(new Error('Only JPEG and PNG images are allowed'));
            return;
          }

          resolve({
            uri: asset.uri,
            type: asset.type,
            fileName: asset.fileName,
            fileSize: asset.fileSize,
          });
        }
      }
    );
  });
}
```

#### For Expo (expo-image-picker):

```javascript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export async function pickImage() {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Permission to access photo library was denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];

  // Get file info for size validation
  const fileInfo = await FileSystem.getInfoAsync(asset.uri);

  if (fileInfo.size > MAX_IMAGE_SIZE) {
    throw new Error('Image must be less than 5MB');
  }

  return {
    uri: asset.uri,
    type: 'image/jpeg',
    fileName: asset.uri.split('/').pop() || 'image.jpg',
    fileSize: fileInfo.size,
  };
}
```

---

## Code Examples

### Complete Chat Screen Component

**File:** `src/screens/ChatScreen.js`

```javascript
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMessagePolling } from '../hooks/useMessagePolling';
import { sendMessage, markMessageAsRead } from '../services/messageService';
import { pickImage } from '../utils/imagePicker';

export default function ChatScreen({ route, navigation }) {
  const { incidentId, currentUserId } = route.params;

  // State
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Refs
  const flatListRef = useRef(null);

  // Polling hook
  const { messages, isLoading, error, refetch } = useMessagePolling(incidentId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage) {
      Alert.alert('Error', 'Please enter a message or select an image');
      return;
    }

    setIsSending(true);

    try {
      const response = await sendMessage(
        incidentId,
        newMessage,
        selectedImage
      );

      // Clear inputs
      setNewMessage('');
      setSelectedImage(null);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSending(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const image = await pickImage();
      if (image) {
        setSelectedImage(image);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to pick image');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleApiError = (err) => {
    if (err.status === 401) {
      Alert.alert('Session Expired', 'Please login again.');
      // Navigate to login
    } else if (err.status === 403) {
      Alert.alert('Unauthorized', 'You do not have permission to message about this incident.');
    } else if (err.status === 422) {
      const errors = err.data.errors ? Object.values(err.data.errors).flat() : [];
      Alert.alert('Validation Error', errors.join('\n') || 'Invalid data');
    } else {
      Alert.alert('Error', err.data?.message || 'An error occurred');
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.sender_id === currentUserId;

    return (
      <View style={[
        styles.messageBubble,
        isMine ? styles.myMessage : styles.theirMessage
      ]}>
        {!isMine && (
          <Text style={styles.senderName}>{item.sender.name}</Text>
        )}

        {item.message && (
          <Text style={styles.messageText}>{item.message}</Text>
        )}

        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}

        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    viewableItems.forEach(item => {
      const message = item.item;

      // Mark as read if not mine and not already read
      if (message.sender_id !== currentUserId && !message.is_read) {
        markMessageAsRead(message.id).catch(err => {
          console.error('Failed to mark message as read:', err);
        });
      }
    });
  }).current;

  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Row */}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePickImage}
            disabled={isSending}
          >
            <Text style={styles.iconButtonText}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={2000}
            editable={!isSending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() && !selectedImage) || isSending
                ? styles.sendButtonDisabled
                : null
            ]}
            onPress={handleSend}
            disabled={(!newMessage.trim() && !selectedImage) || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  imagePreview: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  iconButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

### Unread Count Badge Component

**File:** `src/components/UnreadBadge.js`

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getUnreadCount } from '../services/messageService';

export default function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    fetchCount();

    // Poll every 10 seconds (less frequent than messages)
    const interval = setInterval(fetchCount, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const unreadCount = await getUnreadCount();
      setCount(unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

**Usage in your navigation:**
```javascript
import UnreadBadge from './components/UnreadBadge';

// In your tab navigator or header
<Tab.Screen
  name="Messages"
  component={MessagesScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <View>
        <Icon name="message" size={size} color={color} />
        <UnreadBadge />
      </View>
    ),
  }}
/>
```

---

## UI Components

### Message Bubble Styles

The chat interface uses a WhatsApp-style message bubble design:

- **Your messages:** Blue background, aligned right
- **Their messages:** White background, aligned left
- **Sender name:** Shown only for received messages
- **Timestamp:** Small text at bottom-right
- **Images:** Displayed at 200x200px with rounded corners
- **Max width:** 80% of screen width

### Input Area

- **Text input:** Multi-line, max 2000 characters
- **Image button:** Camera icon on the left
- **Send button:** Disabled when no content
- **Image preview:** Shown above input with remove button

---

## Error Handling

### Common Error Scenarios

```javascript
function handleApiError(err) {
  switch (err.status) {
    case 401:
      // Token expired or invalid
      Alert.alert(
        'Session Expired',
        'Please login again.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
      break;

    case 403:
      // Forbidden - not your incident
      Alert.alert(
        'Unauthorized',
        'You do not have permission to message about this incident.'
      );
      break;

    case 422:
      // Validation error
      const errors = err.data.errors
        ? Object.values(err.data.errors).flat()
        : [];
      Alert.alert(
        'Validation Error',
        errors.join('\n') || 'Please check your input'
      );
      break;

    case 500:
      // Server error
      Alert.alert(
        'Server Error',
        'Something went wrong on our end. Please try again later.'
      );
      break;

    default:
      // Network error or unknown
      Alert.alert(
        'Error',
        err.data?.message || 'An unexpected error occurred'
      );
  }
}
```

### Network Error Handling

```javascript
// Retry logic for network failures
async function fetchWithRetry(fetchFn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFn();
    } catch (err) {
      if (i === retries - 1) throw err;

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Usage
const messages = await fetchWithRetry(() => fetchMessages(incidentId));
```

### Offline Detection

```javascript
import NetInfo from '@react-native-community/netinfo';

// Monitor network status
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (!state.isConnected) {
      Alert.alert(
        'No Internet',
        'You are offline. Messages will be sent when connection is restored.'
      );
    }
  });

  return () => unsubscribe();
}, []);
```

---

## Testing Checklist

### Functional Testing

- [ ] **Send text-only message**
  - Enter text and press send
  - Verify message appears in chat
  - Verify message saved on backend

- [ ] **Send image-only message**
  - Select image from gallery
  - Send without text
  - Verify image displays correctly

- [ ] **Send text + image together**
  - Enter text and select image
  - Send both together
  - Verify both display in message

- [ ] **Validation errors**
  - Try sending empty message (should fail)
  - Try sending image over 5MB (should fail)
  - Try sending non-image file (should fail)
  - Verify error messages display correctly

- [ ] **Authorization**
  - Try messaging about another user's incident (should fail with 403)
  - Verify error message shown

- [ ] **Polling**
  - Open chat screen
  - Have another user send a message
  - Verify message appears within 3 seconds

- [ ] **Background/Foreground**
  - Open chat screen
  - Put app in background
  - Wait 10 seconds
  - Bring app to foreground
  - Verify polling resumes

- [ ] **Mark as read**
  - Receive a message from another user
  - Scroll to view it
  - Verify it's marked as read on backend

- [ ] **Unread count badge**
  - Receive messages on different incidents
  - Check unread badge displays correct count
  - Open chat and verify count decreases

- [ ] **Pagination**
  - Create conversation with 100+ messages
  - Verify pagination works
  - Test scrolling to load more

### UI/UX Testing

- [ ] Keyboard behavior (doesn't cover input)
- [ ] Message bubbles display correctly
- [ ] Images load and display properly
- [ ] Timestamps format correctly
- [ ] Sender names display for received messages only
- [ ] Auto-scroll to bottom on new messages
- [ ] Image preview shows before sending
- [ ] Remove image button works
- [ ] Send button disabled when no content
- [ ] Loading states display during send

### Performance Testing

- [ ] **Polling performance**
  - Monitor battery drain
  - Check network usage
  - Verify stops when backgrounded

- [ ] **Image upload**
  - Test with large images (near 5MB)
  - Verify upload progress indication
  - Test with slow network

- [ ] **Long conversations**
  - Test with 500+ messages
  - Verify scroll performance
  - Check memory usage

### Error Scenarios

- [ ] **No internet connection**
  - Turn off WiFi/data
  - Try sending message
  - Verify error shown

- [ ] **Server down**
  - Simulate 500 error
  - Verify error handling

- [ ] **Token expired**
  - Simulate 401 error
  - Verify redirects to login

- [ ] **Image picker errors**
  - Deny camera permission
  - Deny photo library permission
  - Verify error messages

---

## Performance Optimization

### 1. Image Compression

Compress images before upload to reduce bandwidth:

```javascript
import ImageResizer from 'react-native-image-resizer';

async function compressImage(imageUri) {
  try {
    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      1920,  // max width
      1920,  // max height
      'JPEG',
      80,    // quality (0-100)
      0,     // rotation
    );

    return {
      uri: resizedImage.uri,
      type: 'image/jpeg',
      fileName: resizedImage.name,
    };
  } catch (err) {
    console.error('Image compression failed:', err);
    throw err;
  }
}

// Use in image picker
const image = await pickImage();
const compressedImage = await compressImage(image.uri);
sendMessage(incidentId, null, compressedImage);
```

### 2. Debounced Scroll

Prevent excessive scroll events:

```javascript
import { debounce } from 'lodash';

const scrollToBottom = debounce(() => {
  flatListRef.current?.scrollToEnd({ animated: true });
}, 300);
```

### 3. Memoization

Optimize component rendering:

```javascript
import React, { memo } from 'react';

const MessageBubble = memo(({ message, isMine }) => {
  return (
    <View style={isMine ? styles.myMessage : styles.theirMessage}>
      <Text>{message.message}</Text>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if message ID or read status changes
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.is_read === nextProps.message.is_read
  );
});
```

### 4. Image Caching

Use FastImage for better image performance:

```bash
npm install react-native-fast-image
```

```javascript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: message.image_url,
    priority: FastImage.priority.normal,
  }}
  style={styles.messageImage}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### 5. Polling Optimization

Stop polling when not needed:

```javascript
// Only poll when chat screen is focused
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  React.useCallback(() => {
    startPolling();

    return () => {
      stopPolling();
    };
  }, [incidentId])
);
```

---

## Troubleshooting

### Issue: Messages not appearing

**Solution:**
- Check polling is running (console log in fetch function)
- Verify `incident_id` is correct
- Check network tab for API responses
- Ensure token is valid

### Issue: Images not uploading

**Solution:**
- Verify file size < 5MB
- Check file type is JPG/PNG
- Ensure correct `Content-Type: multipart/form-data`
- Check permissions granted

### Issue: App crashes on image select

**Solution:**
- Check camera/photo library permissions
- Verify image picker library installed correctly
- Check iOS Info.plist has required keys
- Test on real device (not simulator)

### Issue: High battery drain

**Solution:**
- Verify polling stops when backgrounded
- Check AppState listener is working
- Reduce polling frequency if needed
- Use network request inspector to verify no excess requests

### Issue: 401 Unauthorized errors

**Solution:**
- Check token is stored correctly in AsyncStorage
- Verify token is sent in Authorization header
- Check token hasn't expired
- Re-authenticate user if needed

---

## Support & Resources

### Backend API Documentation
- Base URL: `https://your-api-domain.com/api`
- Full API docs: Contact backend team

### Questions?
Contact the backend development team for:
- API endpoint issues
- Authentication problems
- Server errors (500)
- Database-related issues

### Mobile Development Team
For mobile-specific issues:
- UI/UX problems
- Image picker issues
- Polling implementation
- Performance optimization

---

## Changelog

### Version 1.0 (December 27, 2025)
- Initial release
- Polling-based messaging system
- Image upload support (JPG/PNG, max 5MB)
- Unread count badge
- Read receipts
- 30-day message retention (backend)

---

**Happy Coding! 🚀**

For issues or questions, reach out to the development team.
