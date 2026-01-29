# Mobile App Integration Verification Prompt

> **Copy this entire prompt to your mobile app AI assistant**

---

## 🔍 Backend Update: Auto-Opening Incident Form

The backend system has been updated so that when admins answer emergency calls, an incident report form **automatically opens** and is filled out **during the call**. This means incidents are now created earlier in the emergency response workflow.

**IMPORTANT:** The API endpoints and data structure remain **UNCHANGED**. Your mobile app should continue working without modifications, but we need to **verify** that all incident details are being properly displayed.

---

## ✅ Verification Checklist

### 1. API Endpoint Check

**Verify you're using the correct endpoint:**
```
GET /api/responder/dispatches
Authorization: Bearer {token}
```

**Check your polling interval:**
- Should poll every 10-15 seconds
- Verify polling is active when app is in foreground

**Action Items:**
- [ ] Confirm API endpoint URL is correct
- [ ] Verify Bearer token is being sent in headers
- [ ] Check polling interval (should be 10-15 seconds)
- [ ] Test that polling works in background/foreground

---

### 2. Response Data Structure Verification

**Expected Response Format:**
```json
{
  "assigned_dispatches": [
    {
      "id": 123,
      "incident_id": 45,
      "status": "assigned",
      "distance_text": "1.20 km",
      "duration_text": "4 min",

      "incident": {
        "id": 45,
        "type": "medical",
        "address": "Manila City Hall, Arroceros Forest Park, Manila",
        "description": "Elderly person collapsed, unresponsive, possible heart attack",
        "latitude": 14.5995124,
        "longitude": 120.9842195,
        "created_at": "2026-01-29T10:30:00Z",

        "reporter": {
          "name": "Maria Santos",
          "phone_number": "+639171234567"
        }
      },

      "route": {
        "coordinates": [...],
        "distance_text": "1.20 km",
        "duration_text": "4 min"
      }
    }
  ]
}
```

**Action Items:**
- [ ] Parse `assigned_dispatches` array correctly
- [ ] Extract `incident` object from each dispatch
- [ ] Access nested `reporter` object
- [ ] Handle `route.coordinates` array for map display

---

### 3. CRITICAL: Description Field Display

**⚠️ MOST IMPORTANT CHECK ⚠️**

The `incident.description` field now contains **life-critical emergency details** that admins typed during the call with the reporter. This field must be displayed in full.

**Verify Your Code:**

```typescript
// ✅ CORRECT - Shows complete description
<Text style={styles.description}>
  {dispatch.incident.description}
</Text>

// ❌ WRONG - Truncates description
<Text numberOfLines={2} style={styles.description}>
  {dispatch.incident.description}
</Text>

// ❌ WRONG - Cuts off at character limit
<Text style={styles.description}>
  {dispatch.incident.description.substring(0, 100)}...
</Text>
```

**Action Items:**
- [ ] Find where `incident.description` is displayed in your code
- [ ] Verify it's NOT truncated with `numberOfLines` prop
- [ ] Verify it's NOT cut off with `.substring()` or similar
- [ ] Ensure text wrapping is enabled
- [ ] Use readable font size (14-16px minimum)
- [ ] Test with long descriptions (100+ characters)

**Example Test:**
```
Description: "Elderly person collapsed in the street, unresponsive, appears to have difficulty breathing. Bystanders performing CPR. Patient is pale and sweating profusely. Possible heart attack or stroke."
```

This should display **completely** without truncation.

---

### 4. UI Display Requirements

**Verify Each Field is Displayed:**

#### Emergency Type
```typescript
// Should show with icon and color
const emergencyIcons = {
  medical: "🏥",
  fire: "🔥",
  accident: "🚗",
  crime: "🚨",
  natural_disaster: "⚠️",
  other: "❗"
};

<Text>{emergencyIcons[incident.type]} {incident.type.toUpperCase()}</Text>
```

**Action Items:**
- [ ] Emergency type displayed with icon
- [ ] Type converted to uppercase or title case
- [ ] Appropriate color used (red for medical, orange for fire, etc.)

#### Address
```typescript
// Should show full geocoded address
<Text>📍 {incident.address}</Text>
```

**Action Items:**
- [ ] Full address displayed (not truncated)
- [ ] Tappable to open in navigation app
- [ ] Icon prefix for visual clarity

#### Description
```typescript
// Should show COMPLETE text
<View style={styles.descriptionContainer}>
  <Text style={styles.descriptionIcon}>⚠️</Text>
  <Text style={styles.description}>
    {incident.description}
  </Text>
</View>
```

**Action Items:**
- [ ] Complete description shown
- [ ] No truncation or character limits
- [ ] Text wrapping enabled
- [ ] Readable font size
- [ ] Visual emphasis (background color, icon, border)

#### Caller Information
```typescript
// Should show reporter name and phone
<View>
  <Text>👤 {incident.reporter.name}</Text>
  <TouchableOpacity onPress={() => Linking.openURL(`tel:${incident.reporter.phone_number}`)}>
    <Text>📞 Call Reporter</Text>
  </TouchableOpacity>
</View>
```

**Action Items:**
- [ ] Reporter name displayed
- [ ] Phone number available
- [ ] "Call" button opens phone dialer
- [ ] Button uses correct phone number

#### Distance and Time
```typescript
// Should show calculated distance and ETA
<Text>{dispatch.distance_text} away • {dispatch.duration_text}</Text>
```

**Action Items:**
- [ ] Distance displayed (e.g., "1.20 km")
- [ ] Duration displayed (e.g., "4 min")
- [ ] Updated in real-time as responder moves

---

### 5. Map Integration Verification

**Route Display:**
```typescript
<MapView>
  <Polyline
    coordinates={dispatch.route?.coordinates || []}
    strokeColor="#3B82F6"
    strokeWidth={4}
  />

  <Marker
    coordinate={{
      latitude: dispatch.incident.latitude,
      longitude: dispatch.incident.longitude,
    }}
    pinColor="red"
  />
</MapView>
```

**Action Items:**
- [ ] Route polyline draws correctly
- [ ] Uses `route.coordinates` array
- [ ] Incident marker at correct location
- [ ] Responder location marker shown
- [ ] Map zooms to fit both locations
- [ ] Distance/ETA overlay on map

**Navigation Integration:**
```typescript
const openNavigation = (latitude, longitude) => {
  const url = Platform.select({
    ios: `maps://app?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  Linking.openURL(url);
};
```

**Action Items:**
- [ ] "Navigate" button opens device map app
- [ ] Correct coordinates passed to navigation
- [ ] Works on both iOS and Android
- [ ] Fallback URL if primary fails

---

### 6. Status Update Functionality

**Verify Status Transitions:**
```typescript
const updateStatus = async (dispatchId, status) => {
  await fetch(`${API_URL}/api/responder/dispatches/${dispatchId}/status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
};
```

**Valid Status Values:**
- `accepted`
- `declined`
- `en_route`
- `arrived`
- `transporting_to_hospital`
- `completed`
- `cancelled`

**Action Items:**
- [ ] Accept button calls `updateStatus(id, 'accepted')`
- [ ] Decline button calls `updateStatus(id, 'declined')`
- [ ] "Start Navigation" calls `updateStatus(id, 'en_route')`
- [ ] "Mark Arrived" calls `updateStatus(id, 'arrived')`
- [ ] "Complete" calls `updateStatus(id, 'completed')`
- [ ] UI updates immediately after status change
- [ ] Error handling for failed requests

---

### 7. Real-time Updates

**Polling Mechanism:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchDispatches();
  }, 10000); // 10 seconds

  return () => clearInterval(interval);
}, []);
```

**Action Items:**
- [ ] Polling interval set to 10-15 seconds
- [ ] Fetches dispatches when app opens
- [ ] Cleans up interval on unmount
- [ ] Shows loading indicator during fetch
- [ ] Handles network errors gracefully
- [ ] Updates UI when new dispatch arrives

---

### 8. Edge Cases & Error Handling

**Test These Scenarios:**

#### Empty Description
```json
{
  "incident": {
    "description": ""
  }
}
```
- [ ] App doesn't crash
- [ ] Shows placeholder text or hides section

#### Very Long Description
```json
{
  "incident": {
    "description": "Very long text with 500+ characters..."
  }
}
```
- [ ] Complete text displays
- [ ] Text wraps properly
- [ ] Scrollable if needed

#### Missing Reporter Phone
```json
{
  "incident": {
    "reporter": {
      "name": "John Doe",
      "phone_number": null
    }
  }
}
```
- [ ] App doesn't crash
- [ ] Hides "Call" button or shows disabled state

#### Network Failure
- [ ] Shows error message
- [ ] Provides "Retry" button
- [ ] Caches last known dispatch data
- [ ] Offline mode with cached data

---

## 🧪 Testing Procedure

### Step 1: Backend Test
1. Have admin create incident during call
2. Fill form with:
   - Type: Medical Emergency
   - Address: "Manila City Hall, Manila"
   - Description: "Elderly person collapsed, unresponsive, possible heart attack. Patient appears pale and sweating. Bystanders performing CPR."
3. Admin assigns you as responder

### Step 2: Mobile App Test
1. Open mobile app as responder
2. Wait for dispatch to appear (10-15 seconds max)
3. **Verify displayed:**
   - ✅ Type: "🏥 MEDICAL EMERGENCY"
   - ✅ Address: "Manila City Hall, Arroceros Forest Park, Manila"
   - ✅ **Description: Complete text (not truncated)**
   - ✅ Caller: Community user name
   - ✅ Phone: +639XXXXXXXXX
   - ✅ Distance: "X.XX km away"
   - ✅ ETA: "X min"
   - ✅ Map with route polyline
   - ✅ Red pin at incident location
   - ✅ "Accept" and "Decline" buttons

### Step 3: Interaction Test
1. Tap "Call Reporter" → Phone dialer opens with correct number
2. Tap "Accept" → Status changes to "accepted"
3. Tap "Start Navigation" → Device map app opens
4. Tap "Mark Arrived" → Status changes to "arrived"
5. Tap "Complete" → Status changes to "completed"

---

## 🚨 Common Issues & Fixes

### Issue 1: Description is Truncated

**Problem:**
```typescript
// ❌ WRONG
<Text numberOfLines={2}>
  {incident.description}
</Text>
```

**Fix:**
```typescript
// ✅ CORRECT
<Text style={{ flexWrap: 'wrap' }}>
  {incident.description}
</Text>
```

### Issue 2: Route Not Displaying

**Problem:**
```typescript
// ❌ Missing coordinates
<Polyline coordinates={[]} />
```

**Fix:**
```typescript
// ✅ Check for route data
{dispatch.route?.coordinates && (
  <Polyline coordinates={dispatch.route.coordinates} />
)}
```

### Issue 3: Caller Phone Not Working

**Problem:**
```typescript
// ❌ Missing tel: prefix
<Button onPress={() => Linking.openURL(incident.reporter.phone_number)} />
```

**Fix:**
```typescript
// ✅ Add tel: prefix
<Button onPress={() => Linking.openURL(`tel:${incident.reporter.phone_number}`)} />
```

### Issue 4: API Not Updating

**Problem:**
- Not polling frequently enough
- Using wrong endpoint

**Fix:**
```typescript
// ✅ Poll every 10-15 seconds
useEffect(() => {
  const interval = setInterval(fetchDispatches, 10000);
  return () => clearInterval(interval);
}, []);

// ✅ Use correct endpoint
const API_URL = 'https://your-backend-url.com/api';
fetch(`${API_URL}/responder/dispatches`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📋 Final Checklist

Before marking as complete, verify ALL items:

### Critical (Must Have):
- [ ] `GET /api/responder/dispatches` endpoint working
- [ ] Bearer token authentication configured
- [ ] Polling every 10-15 seconds
- [ ] **Description field displayed in full (NO TRUNCATION)**
- [ ] Address displayed completely
- [ ] Emergency type with icon
- [ ] Caller name and phone displayed
- [ ] Distance and ETA displayed
- [ ] Route polyline on map
- [ ] "Accept" button works
- [ ] "Decline" button works
- [ ] Status updates to backend
- [ ] Navigation button opens map app

### Important (Should Have):
- [ ] Real-time ETA updates
- [ ] Error handling for network failures
- [ ] Loading indicators
- [ ] Pull-to-refresh
- [ ] Offline mode with cached data
- [ ] Success/error toast messages

### Nice to Have:
- [ ] Push notifications (FCM)
- [ ] Background polling
- [ ] Voice navigation
- [ ] Incident history
- [ ] Statistics dashboard

---

## 🎯 Expected Outcome

After verification, your mobile app should:

1. **Automatically receive** dispatches created during admin calls
2. **Display complete incident details** including full description
3. **Show all caller information** for contact if needed
4. **Provide navigation** with turn-by-turn route
5. **Allow status updates** throughout emergency response
6. **Handle errors gracefully** with retry options

---

## 📞 Questions to Answer

### Question 1: Is the description field visible?
- Where in your UI is `incident.description` displayed?
- Is it truncated with `numberOfLines` or `.substring()`?
- Can users see the complete text?

### Question 2: Are you polling the correct endpoint?
- What URL are you using for dispatch fetching?
- How often are you polling?
- Are you sending the Bearer token?

### Question 3: Is the map working?
- Are route coordinates displaying as a polyline?
- Is the incident marker at the correct location?
- Does the "Navigate" button open the map app?

### Question 4: Do status updates work?
- Can responders accept dispatches?
- Does the status update on the backend?
- Do you show success/error messages?

---

## 🚀 Action Items

**Run these commands in your mobile app codebase:**

### 1. Search for Description Display
```bash
# Find where incident.description is used
grep -r "incident.description" .
grep -r "description" . | grep -i "text"
```

### 2. Check for Truncation
```bash
# Find numberOfLines usage
grep -r "numberOfLines" .

# Find substring usage
grep -r ".substring" .
grep -r ".slice" .
```

### 3. Verify API Endpoint
```bash
# Find API base URL
grep -r "/api/responder/dispatches" .
grep -r "API_URL" .
```

### 4. Check Polling Interval
```bash
# Find setInterval usage
grep -r "setInterval" .
grep -r "polling" .
```

---

## ✅ Completion Criteria

Your mobile app integration is complete when:

1. ✅ Dispatches appear within 15 seconds of assignment
2. ✅ **Description displays completely (most critical!)**
3. ✅ All incident fields are visible (type, address, caller)
4. ✅ Map shows route from responder to incident
5. ✅ Status updates work (Accept, En Route, Arrived, Complete)
6. ✅ Navigation button opens device map app
7. ✅ "Call Reporter" button dials correct number
8. ✅ Error messages shown for failures
9. ✅ Loading states during API calls
10. ✅ Tested end-to-end with real backend data

---

## 📄 Reference Documentation

For complete API specification, refer to:
- `MOBILE_APP_INTEGRATION.md` (Full API documentation)
- `AUTO_INCIDENT_FORM_FLOW.md` (Backend call flow)

---

**NOW PERFORM THIS VERIFICATION ON YOUR MOBILE APP CODE AND REPORT BACK ANY ISSUES FOUND.**
