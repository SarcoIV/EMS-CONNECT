# EMS-CONNECT: Complete System Documentation (Capstone Reference)

## Context

This document provides a comprehensive technical documentation of the EMS-CONNECT Emergency Management System for capstone school documentation purposes. It covers every part of the codebase: architecture, backend, frontend, database, services, APIs, and integrations.

---

## 1. System Overview

**EMS-CONNECT** is a dual-interface emergency management system that coordinates emergency incident response between community users, EMS responders, and administrators.

### Two Interfaces

| Interface | URL Pattern | Auth Method | Users |
|-----------|------------|-------------|-------|
| **Mobile App** (REST API) | `/api/*` | Bearer Token (Sanctum) | Responders, Community |
| **Web Dashboard** (Inertia) | `/admin/*`, `/user/*` | Session-based | Admins, Users |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | Laravel 12 (PHP 8.2) |
| Frontend Framework | React 19 + TypeScript 5.7 |
| Build Tool | Vite 6 |
| Server Bridge | Inertia.js 2 |
| Database | PostgreSQL (dev) / MySQL (production) |
| API Auth | Laravel Sanctum 4.2 |
| UI Library | Tailwind CSS 4 + Shadcn/ui (Radix UI) |
| Maps | Leaflet + React Leaflet |
| Voice Calls | Agora RTC SDK |
| Real-time | Laravel Echo + Pusher |
| Charts | Recharts |
| Animations | Framer Motion |

### User Role System (Two Separate Systems)

| Field | Values | Purpose |
|-------|--------|---------|
| `role` | `responder`, `community` | Mobile app roles |
| `user_role` | `admin`, `user` | Web dashboard roles |

---

## 2. Project Directory Structure

```
EMS-CONNECT/
├── app/
│   ├── Console/              # Artisan commands (3 commands)
│   ├── Events/               # Broadcast events (2 events)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/          # Mobile API controllers (6 files)
│   │   │   ├── Admin/        # Web admin controllers (16 files)
│   │   │   ├── Auth/         # Authentication controllers (3 files)
│   │   │   └── User/         # Web user controllers (2 files)
│   │   ├── Middleware/        # Custom middleware (7 files)
│   │   └── Requests/         # Form request validation (2 files)
│   ├── Mail/                 # Email templates (4 classes)
│   ├── Models/               # Eloquent models (10 models)
│   ├── Providers/            # Service providers (1 file)
│   └── Services/             # Business logic (7 services)
├── bootstrap/                # App bootstrap & config
├── config/                   # Laravel config files
├── database/
│   ├── factories/            # Test factories
│   ├── migrations/           # Schema migrations (26 files)
│   └── seeders/              # Database seeders (6 seeders)
├── resources/
│   ├── css/app.css           # Tailwind CSS + theme
│   ├── js/
│   │   ├── app.tsx           # React entry point
│   │   ├── ssr.tsx           # SSR entry point
│   │   ├── pages/            # Page components (27 files)
│   │   ├── components/       # Reusable components (58 files)
│   │   ├── layouts/          # Layout wrappers (8 files)
│   │   ├── hooks/            # Custom React hooks (4 hooks)
│   │   ├── types/            # TypeScript definitions (3 files)
│   │   ├── utils/            # Utility functions (2 files)
│   │   └── lib/              # Library helpers
│   └── views/                # Blade views (minimal, Inertia)
├── routes/
│   ├── api.php               # Mobile API routes
│   ├── web.php               # Web dashboard routes
│   ├── console.php           # Console commands
│   └── channels.php          # Broadcasting channels
├── storage/                  # Logs, cache, uploads
├── tests/                    # PHPUnit/Pest tests
├── public/                   # Web server root + compiled assets
├── composer.json             # PHP dependencies
├── package.json              # Node dependencies
├── vite.config.ts            # Vite build config
├── tsconfig.json             # TypeScript config
└── phpunit.xml               # Test config
```

---

## 3. Database Schema

### 3.1 Entity-Relationship Summary

```
Users ──< Incidents ──< Dispatches >── Users (responders)
  │           │              │
  │           ├──< Calls     ├──< PreArrivalForms
  │           │              └──> Hospitals
  │           └──< Messages
  └──< Notifications
  └──< ResponderLocationHistory
```

### 3.2 Tables & Columns

#### **users** - Central user model (all roles)
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| name, first_name, last_name | string | User identity |
| username | string, unique, nullable | Optional username |
| email | string, unique | Login identifier |
| phone_number | string, nullable | Contact number |
| password | string | Hashed password |
| google_id | string, nullable | Google OAuth ID |
| user_role | enum: admin, user | Web dashboard role |
| role | enum: responder, community | Mobile app role |
| email_verified | boolean | Verification status |
| verification_code | string, nullable | 6-digit email code |
| verification_code_expires_at | timestamp | Code expiry |
| base_latitude, base_longitude | decimal(10,8/11,8) | Static base location |
| base_address | string, nullable | Base address text |
| current_latitude, current_longitude | decimal | Real-time GPS |
| location_updated_at | timestamp | Last GPS update |
| responder_status | enum: offline, idle, assigned, en_route, busy | Current status |
| is_on_duty | boolean | Duty toggle |
| duty_started_at, duty_ended_at | timestamp | Duty tracking |
| last_active_at | timestamp | Activity tracking |
| badge_number | string, nullable | Responder badge |
| hospital_assigned | string, nullable | Assigned hospital |
| blood_type, allergies, existing_conditions, medications | string, nullable | Medical info |
| last_login_at | timestamp | Last login |
| created_at, updated_at | timestamps | Laravel timestamps |

#### **incidents** - Emergency reports
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| user_id | FK -> users | Reporter |
| type | enum: medical, fire, accident, crime, natural_disaster, other | Incident type |
| status | enum: pending, dispatched, completed, cancelled | Current status |
| latitude, longitude | decimal | Incident location |
| address | string(500) | Address text |
| description | text, nullable | Details |
| assigned_unit | string, nullable | Assigned unit label |
| assigned_admin_id | FK -> users, nullable | Admin who handled |
| dispatched_at, completed_at | timestamp, nullable | Lifecycle timestamps |
| responders_assigned | int, default 0 | Counter |
| responders_en_route | int, default 0 | Counter |
| responders_arrived | int, default 0 | Counter |

#### **dispatches** - Responder-to-incident assignments
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| incident_id | FK -> incidents | Target incident |
| responder_id | FK -> users | Assigned responder |
| assigned_by_admin_id | FK -> users, nullable | Admin who assigned |
| status | enum: assigned, accepted, declined, en_route, arrived, transporting_to_hospital, completed, cancelled | Workflow status |
| distance_meters | decimal(10,2) | Calculated road distance |
| estimated_duration_seconds | decimal(10,2) | Calculated ETA |
| assigned_at, accepted_at, en_route_at, arrived_at, completed_at, cancelled_at, transporting_to_hospital_at | timestamps | Status timeline |
| cancellation_reason | text, nullable | Why cancelled |
| hospital_id | FK -> hospitals, nullable | Target hospital |
| hospital_distance_meters, hospital_estimated_duration_seconds | decimal | Hospital route |
| hospital_route_data | JSON, nullable | Cached route |
| **Unique constraint** | [incident_id, responder_id] | Prevents duplicates |

#### **calls** - Voice call records (Agora RTC)
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| user_id | FK -> users | Caller |
| receiver_admin_id | FK -> users, nullable | Admin receiver |
| incident_id | FK -> incidents, nullable | Related incident |
| channel_name | string, unique | Agora RTC channel |
| status | enum: active, ended | Call status |
| initiator_type | enum: mobile, admin | Who initiated |
| started_at, answered_at, ended_at | timestamps | Call lifecycle |

#### **pre_arrival_forms** - Optional patient info
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| dispatch_id | FK -> dispatches | Related dispatch |
| responder_id | FK -> users | Submitting responder |
| caller_name, patient_name | string | Names |
| sex | enum: Male, Female, Other | Patient sex |
| age | int | Patient age |
| incident_type | string(100) | Incident classification |
| estimated_arrival | timestamp, nullable | ETA |
| submitted_at | timestamp, nullable | Submission time |

#### **hospitals** - Hospital directory
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| name | string | Hospital name |
| type | enum: government, private | Hospital type |
| address | string(500) | Location |
| latitude, longitude | decimal | GPS coordinates |
| phone_number | string(50), nullable | Contact |
| specialties | JSON array, nullable | Medical specialties |
| image_url | string, nullable | Photo |
| is_active | boolean, default true | Active status |
| bed_capacity | int, nullable | Capacity |
| has_emergency_room | boolean, default true | ER availability |

#### **notifications** - Admin notifications
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| user_id | FK -> users | Target admin |
| type | string | new_incident, dispatch_accepted, emergency_call, etc. |
| title, message | string/text | Notification content |
| data | JSON, nullable | Action URLs, IDs |
| is_read | boolean | Read status |
| read_at | timestamp, nullable | When read |

#### **messages** - Incident chat system
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| incident_id | FK -> incidents | Related incident |
| sender_id | FK -> users | Message sender |
| message | text | Message content |
| image_path | string, nullable | Attachment |
| is_read | boolean | Read status |
| read_at | timestamp, nullable | When read |
| deleted_at | timestamp, nullable | Soft delete |

#### **responder_location_history** - GPS breadcrumb trail
| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | Auto-increment |
| responder_id | FK -> users | Tracked responder |
| dispatch_id | FK -> dispatches, nullable | During which dispatch |
| latitude, longitude | decimal | Position |
| accuracy | decimal, nullable | GPS accuracy |

#### Supporting Tables
- **personal_access_tokens** - Laravel Sanctum API tokens
- **cache** - Application cache
- **jobs** - Queue jobs
- **sessions** - User sessions
- **drivers** - Legacy driver records

---

## 4. Eloquent Models

### 4.1 User (`app/Models/User.php`)
**Relationships:**
- `incidents()` - hasMany Incident (created by user)
- `assignedIncidents()` - hasMany Incident (assigned to admin)
- `dispatches()` - hasMany Dispatch (responder assignments)
- `activeDispatch()` - hasOne Dispatch (current active)
- `assignedIncidentsAsResponder()` - belongsToMany User (via dispatches)
- `calls()` - hasMany Call (initiated)
- `receiverCalls()` - hasMany Call (received)
- `sentMessages()` - hasMany Message
- `notifications()` - hasMany Notification

**Key Methods:**
- `isResponder()`, `isCommunity()`, `isAdmin()` - Role checks
- `isMobileUser()` - Check if mobile app user
- `isAvailableForDispatch()` - Verified + on-duty + idle status + has location
- `hasLocation()` - Checks current_latitude/current_longitude
- `getLocationAttribute()`, `getBaseLocationAttribute()` - Formatted location arrays
- `unreadNotificationsCount()` - Returns unread notification count

**Key Casts:**
- Coordinates: `base_latitude`, `base_longitude`, `current_latitude`, `current_longitude` (decimal:8)
- Booleans: `is_on_duty`, `email_verified`
- Datetimes: `duty_started_at`, `duty_ended_at`, `last_active_at`, `location_updated_at`, `verification_code_expires_at`

### 4.2 Incident (`app/Models/Incident.php`)
**Relationships:**
- `user()` - belongsTo User (reporter)
- `assignedAdmin()` - belongsTo User
- `dispatches()` - hasMany Dispatch
- `assignedResponders()` - belongsToMany User (via dispatches)
- `calls()` - hasMany Call
- `messages()` - hasMany Message

**Key Methods:**
- `isPending()`, `isDispatched()`, `isCompleted()`, `isCancelled()` - Status checks
- `canBeCancelled()` - Checks if status is pending or dispatched
- `canAssignMoreResponders()` - False if completed/cancelled
- `hasActiveDispatches()` - Checks for active dispatch statuses
- `getLocationAttribute()` - Formatted location array

### 4.3 Dispatch (`app/Models/Dispatch.php`)
**Relationships:**
- `incident()` - belongsTo Incident
- `responder()` - belongsTo User
- `assignedBy()` - belongsTo User (admin)
- `preArrivalForm()` / `preArrivalForms()` - hasOne/hasMany
- `hospital()` - belongsTo Hospital

**Status Workflow:**
```
assigned -> accepted -> en_route -> arrived -> transporting_to_hospital -> completed
              |                       |               |                      |
              v                       v               v                      v
           declined               cancelled       cancelled              cancelled
```

**Valid Status Transitions:**
```
assigned     → [accepted, declined, cancelled]
accepted     → [en_route, cancelled]
en_route     → [arrived, cancelled]
arrived      → [transporting_to_hospital, completed, cancelled]
transporting_to_hospital → [completed, cancelled]
completed    → [] (terminal)
declined     → [] (terminal)
cancelled    → [] (terminal)
```

**Key Methods:**
- `accept()`, `markEnRoute()`, `markArrived()`, `markTransportingToHospital()`, `complete()` - Status updates
- `decline(?reason)`, `cancel(?reason)` - Terminal statuses
- `isActive()`, `isCompleted()`, `isCancelled()` - Status checks
- `getFormattedDistanceAttribute()`, `getFormattedDurationAttribute()` - Formatting
- `scopeActive()` - Status in ['assigned', 'accepted', 'en_route', 'arrived', 'transporting_to_hospital']
- `scopeForIncident()`, `scopeForResponder()` - Query scopes

### 4.4 Call (`app/Models/Call.php`)
**Relationships:** `user()`, `caller()` (alias), `receiver()`, `incident()`

**Key Methods:**
- `generateChannelName(userId, ?adminId)` - Unique Agora channel ID
- `isActive()`, `isEnded()` - Status checks
- `isAdminInitiated()` - Checks initiator_type
- `getCaller()`, `getReceiver()` - Smart routing based on initiator_type

### 4.5 Other Models
- **PreArrivalForm** (`app/Models/PreArrivalForm.php`) - Optional patient data form; belongs to Dispatch and Responder (User)
- **Hospital** (`app/Models/Hospital.php`) - Hospital directory entry with scopes (`scopeActive()`, `scopeOfType()`), specialties array, `getFullImageUrlAttribute()`
- **Notification** (`app/Models/Notification.php`) - Admin notification with `markAsRead()`, scopes: `scopeUnread()`, `scopeRead()`, `scopeRecent()`
- **Message** (`app/Models/Message.php`) - Incident chat message with SoftDeletes, image support (`hasImage()`, `getImageUrlAttribute()`), `toApiResponse()`, auto-cleanup on force delete
- **ResponderLocationHistory** (`app/Models/ResponderLocationHistory.php`) - GPS breadcrumb points
- **Driver** (`app/Models/Driver.php`) - Legacy driver records

---

## 5. Backend Services

### 5.1 DispatchService (`app/Services/DispatchService.php`)
Central business logic for responder assignment.

**Key Methods:**
- `getAvailableResponders(Incident)` - Finds responders within 3km radius; filters by verified, on-duty, idle status, with GPS location; uses Haversine for initial filtering then road distances via DistanceCalculationService
- `assignResponder(Incident, User, User)` - Creates Dispatch record with calculated distance/ETA; validates no duplicate assignments; updates incident status (pending→dispatched); sets responder status to 'assigned'
- `updateDispatchStatus(Dispatch, string, ?string)` - Validates state transitions; updates responder status and incident counters; integrates HospitalRoutingService for 'transporting_to_hospital' status; auto-completes incident when no active dispatches remain
- `notifyResponder(Dispatch)` - Placeholder for Firebase Cloud Messaging push notification

### 5.2 DistanceCalculationService (`app/Services/DistanceCalculationService.php`)
Multi-provider distance calculation with fallback chain.

**Calculation Chain:**
1. **Google Maps Directions API** - Primary road distance provider
2. **OpenRouteService API** - Fallback road distance provider
3. **Haversine formula** - Final fallback if APIs fail

**Key Methods:**
- `calculateHaversineDistance(float, float, float, float)` - Static straight-line distance (meters)
- `calculateRoadDistance(float, float, float, float)` - Primary method with caching (15-minute TTL)
- `calculateDistancesForResponders(Incident, Collection)` - Maps responders with distance data, sorts by distance
- `getRespondersWithinRadius(float, float, int)` - Static Haversine-based filtering

**Returns:** distance_meters, duration_seconds, distance_text, duration_text, route_coordinates, encoded_polyline, method
**Caching:** 15-minute TTL, 5 decimal place coordinate rounding (~1 meter precision)

### 5.3 NotificationService (`app/Services/NotificationService.php`)
Static methods for creating admin notifications.

**Methods:**
- `create(userId, type, title, message, ?data)` - Generic notification creation
- `notifyAllAdmins(type, title, message, ?data)` - Broadcast to all admins
- `newIncident(incidentId, type, address, description)` - New incident notification (action_url to dispatch page)
- `dispatchAccepted(adminId, incidentId, responderId, name, incidentAddress)` - Responder accepted notification
- `emergencyCall(callId, callerName, ?incidentAddress)` - Incoming call notification (broadcasts to all admins)
- `responderArrived(adminId, incidentId, responderName, incidentAddress)` - Arrival notification
- `incidentCompleted(adminId, incidentId, incidentType, incidentAddress)` - Completion notification

### 5.4 VerificationService (`app/Services/VerificationService.php`)
Email verification via 6-digit codes cached for 15 minutes.

**Methods:**
- `generateCode()` - Generates 6-digit verification code
- `storeCode(email, code)` - Stores with 15-minute cache TTL
- `verifyCode(email, code)` - Validates code
- `isCodeExpired(email)` - Expiry check
- `deleteCode(email)` - Cache cleanup

### 5.5 HospitalRoutingService (`app/Services/HospitalRoutingService.php`)
Calculates routes from incident scene to nearest hospital.

**Methods:**
- `getHospitalForDispatch(Dispatch)` - Priority: dispatch override (hospital_id) → responder assigned hospital
- `calculateHospitalRoute(Dispatch)` - Validates hospital, uses DistanceCalculationService for road routing
- `cacheHospitalRoute(Dispatch, array)` - Updates dispatch with hospital routing data

### 5.6 GoogleMapsService (`app/Services/GoogleMapsService.php`)
Google Maps API integration for routing and geocoding.

**Methods:**
- `getDirections(originLat, originLon, destLat, destLon, options)` - Road distance/route with 15-minute cache
- `geocodeAddress(address)` - Address to coordinates with 24-hour cache

### 5.7 PolylineDecoder (`app/Services/PolylineDecoder.php`)
Decodes and encodes polylines from routing APIs into coordinate arrays.

**Static Methods:**
- `decode(encoded, precision=5)` - Polyline string to coordinate array
- `encode(coordinates, precision=5)` - Coordinate array to polyline string

---

## 6. API Controllers (Mobile App)

### 6.1 AuthController (`app/Http/Controllers/Api/AuthController.php`)
| Method | Route | Description |
|--------|-------|-------------|
| `login()` | POST `/api/auth/login` | Returns Sanctum bearer token; validates mobile role |
| `signup()` | POST `/api/auth/signup` | Register (responder/community), sends verification email |
| `verifyEmail()` | POST `/api/auth/verify-email` | Verify with 6-digit code |
| `resendVerificationCode()` | POST `/api/auth/resend-verification` | Resend code (rate limited: 5/min) |
| `logout()` | POST `/api/auth/logout` | Revoke token |
| `user()` | GET `/api/auth/user` | Get current user profile |

### 6.2 IncidentController (`app/Http/Controllers/Api/IncidentController.php`)
| Method | Route | Description |
|--------|-------|-------------|
| `store()` | POST `/api/incidents` | Create incident report (supports flat and nested location formats) |
| `myIncidents()` | GET `/api/incidents/my` | User's incident history |
| `show()` | GET `/api/incidents/{id}` | Single incident details |
| `cancel()` | POST `/api/incidents/{id}/cancel` | Cancel pending incident |
| `tracking()` | GET `/api/incidents/{id}/tracking` | Real-time responder tracking data |

### 6.3 ResponderController (`app/Http/Controllers/Api/ResponderController.php`)
| Method | Route | Description |
|--------|-------|-------------|
| `updateLocation()` | POST `/api/responder/location` | Update real-time GPS + location history |
| `updateStatus()` | POST `/api/responder/status` | Toggle on/off duty |
| `getAssignedIncidents()` | GET `/api/responder/dispatches` | Get assigned + nearby incidents |
| `updateDispatchStatus()` | POST `/api/responder/dispatches/{id}/status` | Accept/en_route/arrived/completed |
| `getHospitalRoute()` | GET `/api/responder/dispatches/{id}/hospital-route` | Hospital routing data |
| `storePreArrival()` | POST `/api/responder/dispatches/{dispatchId}/pre-arrival` | Submit patient info |

### 6.4 CallController (`app/Http/Controllers/Api/CallController.php`)
| Method | Route | Description |
|--------|-------|-------------|
| `start()` | POST `/api/call/start` | Initiate emergency voice call |
| `end()` | POST `/api/call/end` | End active call |
| `active()` | GET `/api/call/active` | Get user's active call |
| `incoming()` | GET `/api/call/incoming` | Poll for admin-initiated calls |
| `answer()` | POST `/api/call/answer` | Answer incoming call |
| `reject()` | POST `/api/call/reject` | Reject incoming call |

### 6.5 MessageController (`app/Http/Controllers/Api/MessageController.php`)
| Method | Route | Description |
|--------|-------|-------------|
| `store()` | POST `/api/messages` | Send chat message |
| `index()` | GET `/api/messages` | Get messages for incident |
| `unreadCount()` | GET `/api/messages/unread-count` | Unread message count |
| `markAsRead()` | POST `/api/messages/{id}/mark-read` | Mark message read |

### 6.6 UserController (`app/Http/Controllers/Api/UserController.php`)
| Method | Route | Description |
|--------|-------|-------------|
| `show()` | GET `/api/user/profile` | Get profile |
| `updateProfile()` | PUT/POST `/api/user/profile` | Update profile fields |
| `changePassword()` | PUT/POST `/api/user/password` | Change password |

### API Response Format
```json
{
  "message": "Success or error description",
  "data": { /* payload */ },
  "errors": { /* validation errors if any */ }
}
```

---

## 7. Web Controllers (Admin Dashboard)

### 7.1 DashboardController (`app/Http/Controllers/Admin/DashboardController.php`)
- `index()` - Main dashboard with KPIs, charts, recent incidents
- `stats()` - JSON endpoint for real-time polling (10-second intervals)
- `updateIncidentStatus()` - Quick status change (PATCH)
- `dispatch()` - Trigger dispatch workflow (PATCH)

### 7.2 DispatchController (`app/Http/Controllers/Admin/DispatchController.php`)
- `show()` - Dispatch assignment page with map
- `getAvailableResponders()` - JSON list of nearby responders with distances
- `assignResponder()` - Create dispatch (uses DispatchService)
- `cancelDispatch()` - Cancel assignment

### 7.3 LiveMapController (`app/Http/Controllers/Admin/LiveMapController.php`)
- `index()` - Full-screen live tracking map
- `data()` - JSON endpoint for real-time map markers (polled every 5 seconds)
- `getRouteHistory()` - GPS breadcrumb trail for route replay

### 7.4 IncidentReportsController (`app/Http/Controllers/Admin/IncidentReportsController.php`)
- `index()` - Filterable incident list (status, type, date range, search)
- `export()` - CSV export

### 7.5 IncidentOverviewController (`app/Http/Controllers/Admin/IncidentOverviewController.php`)
- `show()` - Detailed single-incident view with timeline, responders, calls, pre-arrival data

### 7.6 PeopleController (`app/Http/Controllers/Admin/PeopleController.php`)
- `index()` - User management (community, responders, admins)
- `show()` - Individual user details
- `createAdmin()` / `createResponder()` - Account creation
- `deleteAdmin()` - Admin account deletion
- `toggleStatus()` / `toggleResponderStatus()` - Activate/deactivate

### 7.7 CallsController (`app/Http/Controllers/Admin/CallsController.php`)
- `incoming()` - Poll for incoming calls
- `answer()` / `end()` - Call lifecycle
- `initiateCall()` - Admin-initiated call to community user
- `getCallStatus()` - Poll call status

### 7.8 AdminMessageController (`app/Http/Controllers/Admin/AdminMessageController.php`)
- `index()` - Chat interface page
- `getConversations()` - All conversations grouped by user
- `getMessages()` / `sendMessage()` - Message operations
- `markConversationAsRead()` - Mark all messages in conversation as read

### 7.9 Other Admin Controllers
- **AdministrationController** - EMS monitoring dashboard with responder activity stats
- **NotificationController** - Notification CRUD with mark-as-read and mark-all-as-read
- **SettingsController** - Profile and password updates
- **HospitalDirectoryController** - Hospital listing page
- **ArchiveController** - Archived/completed incidents
- **IncidentManagementController** - Create incident during call
- **AdminApiController** - API endpoints for active responders, location history, pre-arrival forms (used by admin frontend)
- **UserEditController** - User editing interface

### 7.10 Auth & User Controllers
- **HomeController** - Public landing page
- **LoginController** (`Auth/`) - Web login/logout
- **RegisterController** (`Auth/`) - Web registration
- **SocialAuthController** (`Auth/`) - Google OAuth redirect/callback
- **UserDashboardController** (`User/`) - Community user dashboard
- **UserSettingsController** (`User/`) - User profile and password settings

---

## 8. Middleware

| Middleware | File | Purpose |
|-----------|------|---------|
| **AdminMiddleware** | `app/Http/Middleware/AdminMiddleware.php` | Guards `/admin/*` routes; requires `user_role === 'admin'` |
| **UserMiddleware** | `app/Http/Middleware/UserMiddleware.php` | Guards `/user/*` routes; requires authenticated user |
| **GuestMiddleware** | `app/Http/Middleware/GuestMiddleware.php` | Prevents logged-in users from accessing auth pages |
| **CheckRole** | `app/Http/Middleware/CheckRole.php` | Flexible role checking for API routes |
| **HandleInertiaRequests** | `app/Http/Middleware/HandleInertiaRequests.php` | Shares global data with React (user, errors, flash) |
| **HandleAppearance** | `app/Http/Middleware/HandleAppearance.php` | Theme management (dark mode disabled) |
| **LogCallRequests** | `app/Http/Middleware/LogCallRequests.php` | Logs call-related requests for debugging |

---

## 9. Frontend Pages

### 9.1 Authentication Pages

#### Login (`resources/js/pages/Auth/Login.tsx`)
- Email + password form
- Google OAuth button
- Flash message display (success/error)
- Custom branded UI with EMS watermark backgrounds

#### Register (`resources/js/pages/Auth/Register.tsx`)
- Name, email, password fields
- Standard registration form

#### Welcome (`resources/js/pages/Welcome.tsx`)
- Public landing page with: Navbar, Hero section, About, Features (6-card grid), CTA, Footer

### 9.2 Admin Dashboard Pages

#### Dashboard (`resources/js/pages/Admin/Dashboard.tsx`)
- **4 KPI cards**: Pending, Dispatched, Completed, Active Calls
- **Charts**: Monthly trend (bar), Incident type distribution (pie) via Recharts
- **Recent incidents table** with search, inline responder status, quick actions
- **Real-time polling** every 10 seconds
- **Quick stats footer**: Today, Month, Total Users

#### Dispatch (`resources/js/pages/Admin/Dispatch/`)
- `index.tsx` - Main dispatch page
- `DispatchMap.tsx` - Full-screen Leaflet map with incident marker
- `RespondersList.tsx` - Available responders list with distance/ETA
- Left panel: Incident info + legend
- Right panel: Available responders with distance/ETA
- Dispatch confirmation modal + success modal
- Polling for responder updates every 5 seconds

#### Live Map (`resources/js/pages/Admin/LiveMap/`)
- `index.tsx` - Dynamic Leaflet map (SSR-safe initialization)
- `ResponderMonitoring.tsx` - Responder monitoring panel
- Real-time marker updates every 5 seconds
- Custom markers: incident (emoji icons), responder (ambulance), hospital (color-coded)
- Route history polylines
- Filter controls: status, type, active-only toggle
- Side panels: active calls, incident list

#### Incident Reports (`resources/js/pages/Admin/IncidentReports/index.tsx`)
- Filterable/searchable incident table
- Filters: status, type, date range, text search
- Stats summary cards
- CSV export

#### Incident Overview (`resources/js/pages/Admin/IncidentOverview/`)
- `index.tsx` - Main overview page
- `IncidentSummary.tsx` - Summary card
- `AssignedResponders.tsx` - Responder list
- `PreArrivalInfo.tsx` - Pre-arrival form data
- `IncidentTimeline.tsx` - Timeline view
- `CallHistory.tsx` - Call records
- Supporting files: `types.ts`, `constants.ts`, `utils.ts`
- Breadcrumb navigation, action buttons

#### Administration (`resources/js/pages/Admin/Administration/index.tsx`)
- 3 stat cards: Total Availability, Live Status, Active Units
- EMS activity table with search

#### Hospital Directory (`resources/js/pages/Admin/HospitalDirectory/index.tsx`)
- Government & Private hospital sections
- Card layout with detail modal (image, specialties, bed capacity, ER status)

#### People Management (`resources/js/pages/Admin/People/index.tsx`)
- User list with role/status filtering
- Create admin/responder accounts
- Toggle user activation

#### Chats (`resources/js/pages/Admin/Chats.tsx`)
- Conversation list grouped by user
- Message thread view
- Send/receive messages

#### Settings (`resources/js/pages/Admin/Settings/index.tsx`)
- Profile update (name)
- Password change (with current password validation)

#### Archive (`resources/js/pages/Admin/Archive/index.tsx`)
- Completed/archived incidents list

#### User Edit (`resources/js/pages/Admin/UserEdit/index.tsx`)
- User editing interface

### 9.3 User Pages
#### User Dashboard (`resources/js/pages/User/Dashboard.tsx`)
- Basic dashboard for community users (limited features)

---

## 10. Frontend Components

### 10.1 Admin Components (`resources/js/components/admin/`)

| Component | Purpose |
|-----------|---------|
| `header.tsx` | Sticky top nav bar with notification bell |
| `sidebar.tsx` | Left navigation with menu items, user profile, brand logo |
| `IncomingCallNotification.tsx` | Agora RTC integration; incoming call card with answer/reject; active call modal with mute/timer; auto-opens incident form |
| `DispatchConfirmationModal.tsx` | Confirm before dispatching responder |
| `DispatchSuccessModal.tsx` | Success message after dispatch with auto-redirect |
| `ResponderTrackingModal.tsx` | Google Maps-based real-time responder tracking |
| `CreateIncidentModal.tsx` | Create incident during call; auto-fills caller info |
| `NotificationDropdown.tsx` | Bell icon with unread notification dropdown |

### 10.2 User Components (`resources/js/components/user/`)

| Component | Purpose |
|-----------|---------|
| `header.tsx` | User dashboard header |
| `sidebar.tsx` | User dashboard sidebar navigation |

### 10.3 Shadcn/ui Components (`resources/js/components/ui/`)
27 Radix UI-based components: `alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `collapsible`, `dialog`, `dropdown-menu`, `icon`, `input`, `label`, `navigation-menu`, `placeholder-pattern`, `progress`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `switch`, `tabs`, `toast`, `toggle`, `toggle-group`, `tooltip`

### 10.4 App Components (`resources/js/components/`)
19 shared application components: `app-content`, `app-header`, `app-logo-icon`, `app-logo`, `app-shell`, `app-sidebar-header`, `app-sidebar`, `appearance-dropdown`, `appearance-tabs`, `breadcrumbs`, `delete-user`, `heading-small`, `heading`, `icon`, `input-error`, `nav-footer`, `nav-main`, `nav-user`, `text-link`

### 10.5 Layout Components (`resources/js/layouts/`)
- `app-layout.tsx` - Main authenticated wrapper
- `auth-layout.tsx` - Auth pages wrapper
- `app/app-sidebar-layout.tsx` - Sidebar + content area
- `app/app-header-layout.tsx` - Header-only layout
- `auth/auth-card-layout.tsx` - Centered card for auth
- `auth/auth-simple-layout.tsx` - Simple auth layout
- `auth/auth-split-layout.tsx` - Two-panel auth layout
- `settings/layout.tsx` - Settings page layout

### 10.6 Custom React Hooks (`resources/js/hooks/`)

| Hook | File | Returns | Purpose |
|------|------|---------|---------|
| `useAppearance` | `use-appearance.tsx` | `{ appearance, updateAppearance }` | Theme management (light/dark/system) |
| `useIsMobile` | `use-mobile.tsx` | `boolean` | Responsive detection (768px breakpoint) |
| `useInitials` | `use-initials.tsx` | `(name) => initials` | Generate user initials ("John Doe" -> "JD") |
| `useMobileNavigation` | `use-mobile-navigation.ts` | cleanup function | Mobile nav side effects |

### 10.7 Utility Functions

**`lib/utils.ts`** - `cn()` function for merging Tailwind classes (clsx + tailwind-merge)

**`utils/dateFormat.ts`**:
- `formatDateTime()` - "Jan 28, 2026, 10:30 AM"
- `formatDate()` - "Jan 28, 2026"
- `formatTime()` - "10:30 AM"
- `formatTimeAgo()` - "2m ago", "3h ago"
- `formatRelativeDate()` - "Today", "Yesterday", "3 days ago"

**`utils/logger.ts`** - Client-side logging singleton with Axios interceptors

### 10.8 TypeScript Types (`resources/js/types/`)

**`index.d.ts`** - Primary type definitions:
```typescript
interface Auth { user: User }
interface User { id, name, email, avatar?, email_verified_at, created_at, updated_at }
interface BreadcrumbItem { title, href }
interface NavItem { title, href, icon?, isActive? }
interface NavGroup { title, items: NavItem[] }
interface SharedData { name, quote, auth, ziggy, ... }
```

**`global.d.ts`** - Global type augmentations
**`vite-env.d.ts`** - Vite environment type definitions

---

## 11. External Integrations

| Service | Purpose | Usage |
|---------|---------|-------|
| **Agora RTC SDK** | Real-time voice calls between mobile users and admins | Frontend + Backend; unique channel per call |
| **Google Maps Directions API** | Primary road distance/duration calculations | Backend only; primary routing provider |
| **OpenRouteService API** | Alternative road distance calculations | Backend only; fallback provider |
| **Google Maps JavaScript API** | Map visualization in ResponderTrackingModal | Frontend only |
| **Leaflet + OpenStreetMap** | Interactive maps (live map, dispatch) | Frontend only |
| **Google OAuth (Socialite)** | Social login for web dashboard | Backend + redirect flow |
| **Gmail SMTP** | Email verification codes, account notifications | Backend only |
| **Pusher / Laravel Echo** | WebSocket broadcasting for real-time events | Both; currently uses polling primarily |
| **Twilio SDK** | SMS/Communication capabilities | Backend (configured in composer.json) |

---

## 12. Core Workflows

### 12.1 Incident Reporting & Dispatch
```
1. Community user reports incident (POST /api/incidents)
2. Incident created with status "pending"
3. All admins receive notification (via NotificationService.newIncident)
4. Admin views incident on dashboard
5. Admin clicks "Dispatch" -> Dispatch page
6. System shows available responders within 3km (filtered + sorted by distance)
7. Admin selects responder -> Confirmation modal
8. Dispatch record created (status: assigned)
9. Incident status updated to "dispatched"
10. Responder status updated to "assigned"
11. Responder receives notification on mobile app
12. Responder accepts (status: accepted)
13. Responder marks en_route (status: en_route)
14. Optional: Responder submits pre-arrival form
15. Responder arrives (status: arrived)
16. Optional: Transport to hospital (status: transporting_to_hospital)
17. Responder completes (status: completed)
18. When no active dispatches remain, incident auto-completes
```

### 12.2 Voice Call Flow
```
1. Community user initiates call (POST /api/call/start)
2. Agora RTC channel created with unique name
3. Admin polls for incoming calls (GET /admin/calls/incoming)
4. Admin answers -> joins Agora channel
5. Both parties connected via WebRTC
6. Admin can open CreateIncidentModal during call
7. Either party ends call (POST /api/call/end or /admin/calls/end)
```

### 12.3 Responder Location Tracking
```
1. Responder goes on duty (POST /api/responder/status)
2. Mobile app sends GPS updates (POST /api/responder/location)
3. Location stored in users table (current_lat/long)
4. Location also stored in responder_location_history (breadcrumbs)
5. Admin Live Map polls /admin/live-map/data every 5 seconds
6. Map markers update with responder positions
7. Route history displayed as polylines
```

### 12.4 Authentication Flows
**Mobile App:**
```
Signup -> Email verification (6-digit code, 15-min expiry) -> Login -> Bearer token
```

**Web Dashboard:**
```
Login form (email/password) OR Google OAuth -> Session-based auth
```

---

## 13. Real-time Features

| Feature | Mechanism | Interval |
|---------|-----------|----------|
| Dashboard stats | Polling `/admin/dashboard/stats` | 10 seconds |
| Live map markers | Polling `/admin/live-map/data` | 5 seconds |
| Available responders | Polling in dispatch page | 5 seconds |
| Incoming calls | Polling `/admin/calls/incoming` | 3 seconds |
| Notifications | Polling `/admin/notifications/unread-count` | Periodic |
| Voice calls | Agora RTC SDK (WebRTC) | Real-time P2P |
| Broadcasting | Laravel Echo + Pusher (available but uses polling primarily) | Event-driven |

---

## 14. Mail Classes

| Class | File | Purpose |
|-------|------|---------|
| VerificationMail | `app/Mail/VerificationMail.php` | 6-digit email verification code |
| WelcomeEmail | `app/Mail/WelcomeEmail.php` | First-time Google OAuth login welcome |
| AdminAccountCreated | `app/Mail/AdminAccountCreated.php` | New admin credentials |
| ResponderAccountCreated | `app/Mail/ResponderAccountCreated.php` | New responder credentials |

---

## 15. Database Seeders

| Seeder | Purpose |
|--------|---------|
| `DatabaseSeeder` | Master seeder that calls other seeders |
| `UserSeeder` | Test responder accounts with locations |
| `AdminSeeder` | Test admin accounts |
| `DriverSeeder` | Legacy driver records |
| `HospitalSeeder` | 20+ hospitals in Quezon City (government, private, specialty) |
| `DemoResidentSeeder` | Demo community user accounts |

---

## 16. Events & Broadcasting

| Event | Channel | Purpose |
|-------|---------|---------|
| `ResponderLocationUpdated` | `admin-dashboard` | Real-time responder GPS updates for live map |
| `PreArrivalFormSubmitted` | `admin-dashboard` | Notify admin when patient info submitted |

---

## 17. Artisan Commands & Scheduled Tasks

### Custom Commands (`app/Console/Commands/`)

| Command | File | Purpose |
|---------|------|---------|
| `responders:mark-inactive-offline` | `MarkInactiveRespondersOffline.php` | Auto-mark inactive responders as offline |
| `messages:delete-old` | `DeleteOldMessages.php` | Delete messages older than 30 days |
| `call:list-routes` | `ListCallRoutes.php` | Debug: list call-related routes |

### Scheduled Tasks

| Task | Schedule | Purpose |
|------|----------|---------|
| `responders:mark-inactive-offline` | Every 5 minutes | Auto-mark inactive responders as offline |
| `messages:delete-old` | Daily at 2:00 AM | Delete messages older than 30 days |

---

## 18. Build & Development Commands

```bash
# Setup
composer install && npm install
cp .env.example .env
php artisan key:generate
php artisan migrate && php artisan db:seed

# Development (runs 4 concurrent processes)
composer run dev    # PHP server + Vite HMR + Queue + Logs

# SSR mode (server-side rendering)
composer run dev:ssr    # PHP server + Queue + Logs + SSR

# Code Quality
npm run lint        # ESLint auto-fix
npm run types       # TypeScript checking
npm run format      # Prettier formatting
./vendor/bin/pint   # Laravel Pint PHP formatting

# Production Build
npm run build       # Client bundle
npm run build:ssr   # SSR bundle
```

---

## 19. Security Features

- **API Authentication**: Laravel Sanctum bearer tokens
- **Web Authentication**: Session-based with CSRF protection
- **Password Hashing**: bcrypt
- **Rate Limiting**: Signup (5/min), Verification resend (5/min), Email verification (10/min)
- **Role-based Access**: AdminMiddleware, UserMiddleware, CheckRole
- **API Keys**: Backend-only (never exposed to frontend)
- **CORS**: Properly configured for allowed origins
- **Input Validation**: Form Request classes + inline validation
- **Soft Deletes**: Messages use SoftDeletes for data recovery

---

## 20. Testing

- **Framework**: PHPUnit 11.5.3
- **Test Database**: SQLite in-memory
- **Test Suites**: Unit (`tests/Unit/`) and Feature (`tests/Feature/`)
- **Feature Tests**: Authentication, registration, email verification, password reset, profile updates, dashboard access
- **Run**: `./vendor/bin/phpunit`

---

## 21. Frontend Dependencies Summary

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.0.0 | UI library |
| react-dom | ^19.0.0 | DOM rendering |
| @inertiajs/react | ^2.0.0 | Laravel-React bridge |
| typescript | ^5.7.2 | Type safety |
| vite | ^6.0 | Build tool |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4.0.0 | Utility-first CSS |
| @radix-ui/* | Various | UI primitives (12+ packages) |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Class name utility |
| tailwind-merge | ^3.0.1 | Tailwind class merging |
| lucide-react | ^0.475.0 | Icon library |

### Maps & Location
| Package | Version | Purpose |
|---------|---------|---------|
| leaflet | ^1.9.4 | Map rendering |
| react-leaflet | ^5.0.0 | React Leaflet wrapper |
| @react-google-maps/api | ^2.20.8 | Google Maps integration |

### Real-time & Communication
| Package | Version | Purpose |
|---------|---------|---------|
| agora-rtc-sdk-ng | ^4.24.2 | Voice calls (WebRTC) |
| laravel-echo | ^2.2.6 | WebSocket client |
| pusher-js | ^8.4.0 | Pusher client |

### Data & Visualization
| Package | Version | Purpose |
|---------|---------|---------|
| recharts | ^3.6.0 | Charts |
| framer-motion | ^12.6.3 | Animations |
| date-fns | ^4.1.0 | Date formatting |

### Developer Tools
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9.17.0 | Linting |
| prettier | ^3.4.2 | Code formatting |
| typescript-eslint | ^8.23.0 | TS linting rules |

---

## 22. Backend Dependencies Summary

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| laravel/framework | ^12.0 | Backend framework |
| laravel/sanctum | ^4.2 | API token auth |
| laravel/socialite | ^5.19 | OAuth/Social login |
| inertiajs/inertia-laravel | ^2.0 | Inertia.js server adapter |
| tightenco/ziggy | ^2.5 | Route sharing with JS |
| pusher/pusher-php-server | ^7.2 | WebSocket broadcasting |
| twilio/sdk | ^8.10 | SMS/Communication |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| phpunit/phpunit | ^11.5.3 | Testing |
| laravel/pint | ^1.18 | Code style |
| laravel/pail | ^1.2.2 | Log tailing |
| fakerphp/faker | ^1.23 | Test data generation |
| laravel/sail | ^1.41 | Docker dev environment |

---

---

## Companion Document: Function Reference

For detailed function-by-function documentation explaining **how each function works**, its purpose, step-by-step internal logic, validation rules, return values, and side effects, see:

**[FUNCTION-REFERENCE.md](./FUNCTION-REFERENCE.md)** - 280+ documented functions covering:
- 28 API Controller functions (6 controllers)
- 77 Admin Controller functions (16 controllers)
- 15 Auth & User Controller functions (5 controllers)
- 7 Middleware classes with handle() methods
- 2 Form Request classes
- 40+ Service functions (7 services)
- 100+ Model methods (10 models)

-
