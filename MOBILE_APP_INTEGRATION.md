# EMS-CONNECT Mobile App Integration Guide

> **Complete API specification and integration prompt for mobile app development**

---

## 🎯 Overview

This document provides everything your mobile app AI assistant needs to integrate with the EMS-CONNECT backend system. The mobile app is for **RESPONDERS** (emergency personnel) to receive and respond to incident assignments from the admin dashboard.

---

## ⚠️ CRITICAL REQUIREMENT

When admins create incidents during emergency calls, they fill out:
- **Emergency type** (medical, fire, accident, crime, natural_disaster, other)
- **Address** (geocoded location)
- **Description** (detailed emergency information - the most critical field!)

### **YOUR MOBILE APP MUST DISPLAY ALL THESE FIELDS IN FULL**

The `incident.description` field contains life-critical information that the admin typed during the emergency call. **DO NOT TRUNCATE OR HIDE THIS FIELD.**

---

## 🔐 Authentication

**Base URL:** `https://your-backend-domain.com/api`

**Authentication Type:** Bearer Token (Laravel Sanctum)

**Required Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

---

## 📡 API Endpoints

### 1. Fetch Assigned Dispatches (Main Endpoint)

**Poll this endpoint every 10-15 seconds to check for new assignments**

```http
GET /api/responder/dispatches
Authorization: Bearer {token}
```

**Response:**
```json
{
  "assigned_dispatches": [
    {
      "id": 123,
      "incident_id": 45,
      "status": "assigned",

      // Distance/Time (calculated at assignment)
      "distance_meters": 1200,
      "distance_text": "1.20 km",
      "estimated_duration_seconds": 240,
      "duration_text": "4 min",

      // Current route from responder's location to incident
      "route": {
        "distance_meters": 1200,
        "duration_seconds": 240,
        "distance_text": "1.20 km",
        "duration_text": "4 min",
        "coordinates": [
          {"latitude": 14.5995, "longitude": 120.9842},
          {"latitude": 14.5996, "longitude": 120.9843},
          {"latitude": 14.5997, "longitude": 120.9844}
        ],
        "encoded_polyline": "abc123defgh...",
        "method": "google_maps"
      },

      // Timestamps
      "assigned_at": "2026-01-29T10:30:00Z",
      "accepted_at": null,
      "en_route_at": null,
      "arrived_at": null,

      // === COMPLETE INCIDENT DETAILS (FROM ADMIN FORM) ===
      "incident": {
        "id": 45,
        "type": "medical",
        "status": "dispatched",
        "latitude": 14.5995124,
        "longitude": 120.9842195,
        "address": "Manila City Hall, Arroceros Forest Park, Manila",
        "description": "Elderly person collapsed, unresponsive, possible heart attack. Patient appears pale and sweating.",
        "created_at": "2026-01-29T10:30:00Z",

        // Caller information
        "reporter": {
          "name": "Maria Santos",
          "phone_number": "+639171234567"
        }
      }
    }
  ],

  // Nearby pending incidents (within 3km, if responder is on duty)
  "nearby_incidents": [
    {
      "incident_id": 46,
      "type": "fire",
      "status": "pending",
      "distance_meters": 2500,
      "distance_text": "2.50 km",
      "estimated_duration_seconds": 300,
      "duration_text": "5 min",
      "latitude": 14.6000,
      "longitude": 120.9850,
      "address": "Rizal Park, Manila",
      "description": "Small fire in trash bin, smoke visible",
      "created_at": "2026-01-29T10:35:00Z",
      "can_accept": true,
      "reporter": {
        "name": "Juan Dela Cruz",
        "phone_number": "+639181234567"
      },
      "route": {
        "coordinates": [...],
        "method": "google_maps"
      }
    }
  ],

  // Responder's current location
  "responder_location": {
    "latitude": 14.5990,
    "longitude": 120.9840,
    "updated_at": "2026-01-29T10:30:00Z",
    "is_stale": false,
    "needs_update": false
  },

  // Warnings/Alerts
  "warnings": [
    "Location data is stale. Please update GPS to see accurate results."
  ]
}
```

### 2. Update Dispatch Status

**Update status as responder progresses through the emergency response workflow**

```http
POST /api/responder/dispatches/{dispatch_id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "accepted",
  "reason": "Optional cancellation reason (only for declined/cancelled)"
}
```

**Valid Status Values:**
- `accepted` - Responder accepts the assignment
- `declined` - Responder rejects the assignment
- `en_route` - Responder is traveling to the incident
- `arrived` - Responder has arrived at the scene
- `transporting_to_hospital` - Transporting patient to hospital
- `completed` - Emergency response completed
- `cancelled` - Dispatch cancelled

**Response:**
```json
{
  "message": "Dispatch status updated successfully",
  "dispatch": {
    "id": 123,
    "status": "accepted",
    "accepted_at": "2026-01-29T10:31:00Z"
  }
}
```

### 3. Submit Pre-Arrival Form (OPTIONAL)

**This form is OPTIONAL and should NOT block navigation or status updates**

```http
POST /api/responder/dispatches/{dispatch_id}/pre-arrival
Authorization: Bearer {token}
Content-Type: application/json

{
  "patient_name": "John Doe",
  "patient_age": 65,
  "patient_sex": "male",
  "incident_type": "medical",
  "chief_complaint": "Chest pain and difficulty breathing",
  "notes": "Patient is conscious but in severe pain"
}
```

**When to Show:**
- Display as optional floating button/modal during `en_route` or `arrived` status
- Allow responder to skip/close without submitting
- Can be submitted multiple times (updates existing form)

### 4. Get Nearby Hospitals

```http
GET /api/responder/dispatches/{dispatch_id}/hospitals
Authorization: Bearer {token}
```

**Response:**
```json
{
  "hospitals": [
    {
      "id": 1,
      "name": "Manila Central Hospital",
      "address": "123 Main St, Manila",
      "latitude": 14.6000,
      "longitude": 120.9900,
      "phone_number": "+6322345678",
      "emergency_phone": "+6322345679",
      "distance_meters": 1500,
      "distance_text": "1.50 km",
      "estimated_duration_seconds": 180,
      "duration_text": "3 min",
      "capabilities": ["emergency", "icu", "surgery"],
      "route": {
        "coordinates": [...],
        "method": "google_maps"
      }
    }
  ]
}
```

### 5. Start Transport to Hospital

```http
POST /api/responder/dispatches/{dispatch_id}/transport
Authorization: Bearer {token}
Content-Type: application/json

{
  "hospital_id": 1
}
```

**This automatically:**
- Updates dispatch status to `transporting_to_hospital`
- Caches hospital route for navigation
- Updates incident counters

### 6. Update Responder GPS Location

```http
POST /api/responder/location
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": 14.5995,
  "longitude": 120.9842
}
```

---

## 🎨 UI Requirements

### Dispatch Card Layout

**Required Fields to Display:**

```
┌─────────────────────────────────────────────┐
│ 🏥 MEDICAL EMERGENCY        [Assigned]      │
├─────────────────────────────────────────────┤
│ 1.20 km away • 4 min                        │
│                                             │
│ 📍 Manila City Hall, Arroceros Forest Park  │
│    Manila                                   │
│                                             │
│ ⚠️  Elderly person collapsed, unresponsive, │
│     possible heart attack. Patient appears  │
│     pale and sweating.                      │
│                                             │
│ 👤 Maria Santos          [📞 Call Reporter] │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │         [Map with Route Display]        │ │
│ │                                         │ │
│ │  • Blue dot: Your location              │ │
│ │  • Red pin: Incident location           │ │
│ │  • Blue line: Route                     │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  Reported: 5 minutes ago                    │
│  Assigned: 2 minutes ago                    │
│                                             │
│  [    Accept    ]    [    Decline    ]      │
│                                             │
└─────────────────────────────────────────────┘
```

### Required UI Elements

#### 1. Emergency Type Badge
```typescript
const emergencyIcons = {
  medical: "🏥",
  fire: "🔥",
  accident: "🚗",
  crime: "🚨",
  natural_disaster: "⚠️",
  other: "❗"
};

const emergencyColors = {
  medical: "#EF4444",       // Red
  fire: "#F97316",          // Orange
  accident: "#EAB308",      // Yellow
  crime: "#3B82F6",         // Blue
  natural_disaster: "#8B5CF6", // Purple
  other: "#6B7280"          // Gray
};
```

#### 2. Status Badge
- `assigned` → Gray badge
- `accepted` → Blue badge
- `en_route` → Yellow badge
- `arrived` → Green badge
- `transporting_to_hospital` → Purple badge
- `completed` → Green badge (checkmark)

#### 3. Distance/Time Display
- Show both distance and estimated time
- Format: "1.20 km away • 4 min"
- Update in real-time as responder moves

#### 4. Address Display
- Show complete geocoded address
- Use 📍 pin icon prefix
- Make it tappable to open in maps

#### 5. **Description Display (CRITICAL!)**
- Show **COMPLETE TEXT** from `incident.description`
- **DO NOT TRUNCATE**
- Use ⚠️ icon prefix
- Use readable font size (not too small)
- Allow text wrapping

#### 6. Caller Information
- Show reporter name with 👤 icon
- Show "Call Reporter" button
- Button opens phone dialer with `reporter.phone_number`

#### 7. Map View
- Use React Native Maps or Google Maps SDK
- Draw polyline from responder to incident using `route.coordinates`
- Show responder location (blue dot, updates with GPS)
- Show incident location (red pin/marker)
- Show distance/ETA overlay on map
- Zoom to fit both locations

#### 8. Action Buttons
- Primary button (large, colored)
- Secondary button (outlined)
- Button text changes based on status

---

## 🔄 Status Flow & Actions

### Status Progression

```
assigned → accepted → en_route → arrived → transporting_to_hospital → completed
   ↓                                                                        ↓
declined                                                               cancelled
```

### Action Buttons by Status

| Status | Primary Button | Secondary Button |
|--------|----------------|------------------|
| `assigned` | **Accept** | Decline |
| `accepted` | **Start Navigation** | Cancel |
| `en_route` | **Mark Arrived** | Optional: Pre-Arrival Form |
| `arrived` | **Transport to Hospital** | Complete (No Transport) |
| `transporting_to_hospital` | **Mark Completed** | Navigate to Hospital |

---

## 🗺️ Map Integration

### Draw Route Polyline

```typescript
import MapView, { Polyline, Marker } from 'react-native-maps';

<MapView
  style={styles.map}
  initialRegion={{
    latitude: incident.latitude,
    longitude: incident.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
>
  {/* Route Polyline */}
  <Polyline
    coordinates={route.coordinates}
    strokeColor="#3B82F6"
    strokeWidth={4}
  />

  {/* Incident Location */}
  <Marker
    coordinate={{
      latitude: incident.latitude,
      longitude: incident.longitude,
    }}
    title={incident.type}
    description={incident.address}
    pinColor="red"
  />

  {/* Responder Location */}
  <Marker
    coordinate={{
      latitude: responder.latitude,
      longitude: responder.longitude,
    }}
    title="Your Location"
    pinColor="blue"
  />
</MapView>
```

### Open Device Navigation

```typescript
import { Linking, Platform } from 'react-native';

const openNavigation = (latitude: number, longitude: number) => {
  const url = Platform.select({
    ios: `maps://app?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });

  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      // Fallback to browser-based maps
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(fallbackUrl);
    }
  });
};
```

---

## 💻 Complete Code Example (React Native)

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  RefreshControl,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';

// ============================================
// Types
// ============================================

interface Dispatch {
  id: number;
  incident_id: number;
  status: string;
  distance_text: string;
  duration_text: string;
  assigned_at: string;
  route: {
    coordinates: Array<{ latitude: number; longitude: number }>;
    distance_text: string;
    duration_text: string;
    method: string;
  };
  incident: {
    id: number;
    type: string;
    status: string;
    latitude: number;
    longitude: number;
    address: string;
    description: string;
    created_at: string;
    reporter: {
      name: string;
      phone_number: string;
    };
  };
}

// ============================================
// Constants
// ============================================

const EMERGENCY_ICONS = {
  medical: '🏥',
  fire: '🔥',
  accident: '🚗',
  crime: '🚨',
  natural_disaster: '⚠️',
  other: '❗',
};

const EMERGENCY_COLORS = {
  medical: '#EF4444',
  fire: '#F97316',
  accident: '#EAB308',
  crime: '#3B82F6',
  natural_disaster: '#8B5CF6',
  other: '#6B7280',
};

const API_URL = 'https://your-backend-url.com/api';

// ============================================
// Main Component
// ============================================

const DispatchCard: React.FC<{ dispatch: Dispatch }> = ({ dispatch }) => {
  const { incident, route, distance_text, duration_text } = dispatch;

  const emergencyIcon = EMERGENCY_ICONS[incident.type] || '❗';
  const emergencyColor = EMERGENCY_COLORS[incident.type] || '#6B7280';

  // ============================================
  // Actions
  // ============================================

  const updateDispatchStatus = async (status: string) => {
    try {
      const token = await getAuthToken(); // Your auth token retrieval
      const response = await fetch(
        `${API_URL}/responder/dispatches/${dispatch.id}/status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('Status updated:', data);
        // Refresh dispatch list
      } else {
        console.error('Failed to update status:', data);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const callReporter = () => {
    const phoneUrl = `tel:${incident.reporter.phone_number}`;
    Linking.openURL(phoneUrl);
  };

  const openNavigation = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${incident.latitude},${incident.longitude}`,
      android: `google.navigation:q=${incident.latitude},${incident.longitude}`,
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`;
        Linking.openURL(fallbackUrl);
      }
    });
  };

  const handleAccept = () => {
    updateDispatchStatus('accepted');
  };

  const handleDecline = () => {
    // Show confirmation dialog first
    updateDispatchStatus('declined');
  };

  const handleStartNavigation = () => {
    updateDispatchStatus('en_route');
    openNavigation();
  };

  const handleMarkArrived = () => {
    updateDispatchStatus('arrived');
  };

  const handleComplete = () => {
    updateDispatchStatus('completed');
  };

  // ============================================
  // Render Action Buttons
  // ============================================

  const renderActionButtons = () => {
    switch (dispatch.status) {
      case 'assigned':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: emergencyColor }]}
              onPress={handleAccept}
            >
              <Text style={styles.primaryButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDecline}>
              <Text style={styles.secondaryButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        );

      case 'accepted':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: emergencyColor }]}
              onPress={handleStartNavigation}
            >
              <Text style={styles.primaryButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
        );

      case 'en_route':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: emergencyColor }]}
              onPress={handleMarkArrived}
            >
              <Text style={styles.primaryButtonText}>Mark Arrived</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={openNavigation}>
              <Text style={styles.secondaryButtonText}>Open Navigation</Text>
            </TouchableOpacity>
          </View>
        );

      case 'arrived':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: emergencyColor }]}
              onPress={handleComplete}
            >
              <Text style={styles.primaryButtonText}>Mark Completed</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <ScrollView style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={[styles.typeIcon, { color: emergencyColor }]}>
            {emergencyIcon}
          </Text>
          <Text style={[styles.typeText, { color: emergencyColor }]}>
            {incident.type.toUpperCase()} EMERGENCY
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: emergencyColor }]}>
          <Text style={styles.statusText}>{dispatch.status}</Text>
        </View>
      </View>

      {/* Distance/Time */}
      <Text style={styles.distanceTime}>
        {distance_text} away • {duration_text}
      </Text>

      {/* Address */}
      <TouchableOpacity onPress={openNavigation} style={styles.addressContainer}>
        <Text style={styles.addressIcon}>📍</Text>
        <Text style={styles.address}>{incident.address}</Text>
      </TouchableOpacity>

      {/* CRITICAL: Full Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionIcon}>⚠️</Text>
        <Text style={styles.description}>{incident.description}</Text>
      </View>

      {/* Caller Info */}
      <View style={styles.callerContainer}>
        <View style={styles.callerInfo}>
          <Text style={styles.callerIcon}>👤</Text>
          <Text style={styles.callerName}>{incident.reporter.name}</Text>
        </View>
        <TouchableOpacity style={styles.callButton} onPress={callReporter}>
          <Text style={styles.callButtonText}>📞 Call Reporter</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: incident.latitude,
          longitude: incident.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Route Polyline */}
        {route?.coordinates && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor="#3B82F6"
            strokeWidth={4}
          />
        )}

        {/* Incident Marker */}
        <Marker
          coordinate={{
            latitude: incident.latitude,
            longitude: incident.longitude,
          }}
          title={`${incident.type} Emergency`}
          description={incident.address}
          pinColor="red"
        />
      </MapView>

      {/* Timestamps */}
      <View style={styles.timestamps}>
        <Text style={styles.timestampText}>
          Reported: {formatTimeAgo(incident.created_at)}
        </Text>
        <Text style={styles.timestampText}>
          Assigned: {formatTimeAgo(dispatch.assigned_at)}
        </Text>
      </View>

      {/* Action Buttons */}
      {renderActionButtons()}
    </ScrollView>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  distanceTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  address: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  descriptionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
    lineHeight: 20,
  },
  callerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  callerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  callerName: {
    fontSize: 14,
    color: '#374151',
  },
  callButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  map: {
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  timestamps: {
    marginBottom: 12,
  },
  timestampText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ============================================
// Utility Functions
// ============================================

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const getAuthToken = async (): Promise<string> => {
  // Implement your token retrieval logic
  // Example: return await AsyncStorage.getItem('auth_token');
  return 'your-auth-token';
};

export default DispatchCard;
```

---

## ✅ Implementation Checklist

### Phase 1: Display Incident Details ✓
- [ ] Fetch dispatches from `/api/responder/dispatches`
- [ ] Parse `assigned_dispatches` array correctly
- [ ] Display incident type with icon and color
- [ ] Display full geocoded address
- [ ] **Display complete description (NO TRUNCATION)**
- [ ] Display caller name and phone number
- [ ] Add "Call Reporter" button that opens phone dialer
- [ ] Show distance and estimated time

### Phase 2: Map & Navigation ✓
- [ ] Integrate map view (React Native Maps or Google Maps SDK)
- [ ] Draw route polyline from `route.coordinates` array
- [ ] Add red marker at incident location
- [ ] Add blue marker at responder's current location
- [ ] Implement "Navigate" button to open device maps
- [ ] Show distance/ETA overlay on map

### Phase 3: Status Management ✓
- [ ] Implement Accept/Decline buttons for `assigned` status
- [ ] Implement "Start Navigation" for `accepted` status
- [ ] Implement "Mark Arrived" for `en_route` status
- [ ] Implement "Mark Completed" for `arrived` status
- [ ] POST to `/api/responder/dispatches/{id}/status`
- [ ] Update UI immediately after status change
- [ ] Show appropriate buttons for each status

### Phase 4: Real-time Updates ✓
- [ ] Poll `/api/responder/dispatches` every 10-15 seconds
- [ ] Update dispatch list automatically
- [ ] Show notification/alert for new assignments
- [ ] Handle status changes from backend
- [ ] Update route as responder moves
- [ ] Refresh distance/ETA in real-time

### Phase 5: Additional Features ✓
- [ ] Implement pre-arrival form (optional modal)
- [ ] Implement hospital list and selection
- [ ] Implement transport to hospital flow
- [ ] Add offline mode with cached data
- [ ] Add pull-to-refresh on dispatch list
- [ ] Add error handling and retry logic

---

## 🧪 Testing Verification

### End-to-End Test Scenario

1. **Admin Side (Backend):**
   - Community user calls admin
   - Admin answers call
   - Admin clicks "Create Incident Report"
   - Admin fills form:
     - Type: "Medical Emergency"
     - Address: "Manila City Hall, Manila"
     - Description: "Elderly person collapsed, unresponsive, possible heart attack"
   - Admin clicks "Create & Dispatch"
   - Admin selects responder and assigns

2. **Mobile App Side (Responder):**
   - App polls `/api/responder/dispatches`
   - New dispatch appears in list

3. **Verify Mobile App Displays:**
   - ✅ Emergency type: "🏥 MEDICAL EMERGENCY"
   - ✅ Distance: "1.20 km away"
   - ✅ ETA: "4 min"
   - ✅ Address: "Manila City Hall, Arroceros Forest Park, Manila"
   - ✅ **Description: "Elderly person collapsed, unresponsive, possible heart attack"** (complete text)
   - ✅ Caller: "Maria Santos"
   - ✅ Phone: "+639171234567"
   - ✅ "Call Reporter" button works
   - ✅ Map shows route with polyline
   - ✅ Red pin at incident location
   - ✅ "Accept" and "Decline" buttons visible

4. **Test Status Flow:**
   - Click "Accept" → Status changes to "accepted"
   - Click "Start Navigation" → Status changes to "en_route", opens maps
   - Click "Mark Arrived" → Status changes to "arrived"
   - Click "Mark Completed" → Status changes to "completed"

---

## ⚠️ Common Pitfalls to Avoid

### ❌ DO NOT:
1. **Truncate description field** - Show complete text
2. **Skip caller information** - Always display reporter name/phone
3. **Hardcode coordinates** - Use API response data
4. **Block UI on pre-arrival form** - Make it optional
5. **Forget to poll API** - Implement regular polling (10-15s)
6. **Ignore route coordinates** - Display route on map
7. **Use wrong status values** - Follow exact status strings
8. **Skip error handling** - Handle network failures gracefully

### ✅ DO:
1. **Display full description** - Critical emergency details
2. **Show all incident fields** - Type, address, description, caller
3. **Update route in real-time** - As responder moves
4. **Implement all status buttons** - Complete workflow
5. **Poll API regularly** - Check for new assignments
6. **Handle offline mode** - Cache last known data
7. **Test end-to-end** - Verify with real backend data
8. **Show helpful error messages** - Guide user on failures

---

## 🔧 API Error Handling

### Error Response Format

```json
{
  "message": "Error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response data |
| 401 | Unauthorized | Token expired, redirect to login |
| 403 | Forbidden | User is not a responder |
| 404 | Not Found | Dispatch/incident not found |
| 422 | Validation Error | Invalid status transition or data |
| 500 | Server Error | Show retry option |

### Retry Logic

```typescript
const fetchWithRetry = async (url: string, options: any, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      if (response.status === 401) {
        // Token expired, redirect to login
        throw new Error('Unauthorized');
      }

      if (i === retries - 1) throw new Error('Max retries reached');

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};
```

---

## 📊 Data Flow Summary

```
1. Admin creates incident (type, address, description)
   ↓
2. Backend stores incident in database
   ↓
3. Admin assigns responder
   ↓
4. Backend creates dispatch record with route calculation
   ↓
5. Mobile app polls /api/responder/dispatches
   ↓
6. Backend returns complete incident details + route
   ↓
7. Mobile app displays dispatch card with all fields
   ↓
8. Responder interacts (Accept, Navigate, Arrive, Complete)
   ↓
9. Mobile app POSTs status updates to backend
   ↓
10. Backend updates dispatch status and incident counters
```

---

## 🎯 Critical Success Factors

### Must Have (P0):
- ✅ Display **complete** incident description
- ✅ Display caller name and phone
- ✅ Show route on map
- ✅ Implement all status transitions
- ✅ Poll API for new assignments

### Should Have (P1):
- ✅ Real-time ETA updates
- ✅ Offline mode with caching
- ✅ Error handling and retry logic
- ✅ Pre-arrival form (optional)
- ✅ Hospital routing

### Nice to Have (P2):
- Push notifications via FCM
- Voice navigation integration
- Incident history/archive
- Response time statistics

---

## 📞 Support & Questions

If you encounter integration issues:

1. **Verify API access:**
   - Test endpoints with Postman
   - Check Bearer token is valid
   - Confirm base URL is correct

2. **Check response format:**
   - Compare actual response to documented format
   - Verify all required fields are present
   - Check data types match

3. **Debug UI issues:**
   - Verify all fields are being parsed
   - Check description is not truncated
   - Ensure map coordinates are valid

4. **Contact backend team:**
   - Provide API endpoint and request
   - Share error messages and status codes
   - Describe expected vs actual behavior

---

## 🚀 Quick Start Prompt for AI

**Copy this to your mobile app AI assistant:**

> You are building a React Native mobile app for EMS-CONNECT. Implement a dispatch card component that:
>
> 1. Fetches assigned dispatches from `GET /api/responder/dispatches` (poll every 10-15 seconds)
> 2. Displays each dispatch card with:
>    - Emergency type icon and badge
>    - Distance and ETA
>    - Full address
>    - **Complete description text (DO NOT TRUNCATE)**
>    - Caller name and phone with "Call" button
>    - Map with route polyline
>    - Status-appropriate action buttons
> 3. Updates status via `POST /api/responder/dispatches/{id}/status`
> 4. Opens device navigation when "Navigate" is tapped
>
> **CRITICAL:** The `incident.description` field contains life-critical emergency details entered by the admin during the call. Display this field in FULL without truncation.
>
> Use the complete API specification and code examples from the MOBILE_APP_INTEGRATION.md file in the project root.

---

**End of Document**

This document contains everything your mobile app needs to integrate with the EMS-CONNECT backend. Share it with your mobile development team or paste the Quick Start Prompt to your AI assistant.
