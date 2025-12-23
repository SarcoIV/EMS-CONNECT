# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup
```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

### Development Server
```bash
# Run all development services concurrently (PHP server, Vite, Queue, Logs)
composer run dev

# SSR mode (server-side rendering)
composer run dev:ssr
```

### Code Quality
```bash
# Frontend
npm run lint              # ESLint auto-fix
npm run types             # TypeScript type checking
npm run format            # Prettier auto-format
npm run format:check      # Check formatting

# Backend
./vendor/bin/pint         # Laravel Pint code style fixer
./vendor/bin/phpunit      # Run PHP tests
```

### Build
```bash
npm run build             # Production build
npm run build:ssr         # SSR production build
```

## Architecture Overview

### Technology Stack
- **Backend**: Laravel 12 (PHP 8.2) with Inertia.js
- **Frontend**: React 19 + TypeScript + Vite 6
- **Database**: PostgreSQL
- **Authentication**: Laravel Sanctum (API) + Sessions (Web)
- **Styling**: Tailwind CSS 4 + Shadcn/ui (Radix UI primitives)
- **Maps**: Leaflet + React Leaflet
- **Real-time Voice**: Agora RTC SDK

### Application Types

This is a dual-interface emergency management system:

1. **Mobile App** (REST API at `/api/*`)
   - React Native or similar mobile client
   - Uses Bearer token authentication (Sanctum)
   - Two user types: `responder` (emergency responders) and `community` (residents)
   - Reports incidents, manages dispatch status, GPS tracking, voice calls

2. **Web Dashboard** (Inertia routes at `/admin/*` and `/user/*`)
   - Session-based authentication
   - Two user roles: `admin` (system management) and `user` (limited features)
   - Admin manages dispatch, tracks responders, views analytics

### Key Database Models & Relationships

**Users** - Central model with multiple roles
- Mobile roles: `responder`, `community`
- Web roles: `admin`, `user`
- Stores GPS location (base + current), duty status, verification state
- Relationships: creates Incidents, assigned to Incidents, participates in Calls, assigned Dispatches

**Incidents** - Emergency reports
- Types: medical, fire, accident, crime, natural_disaster, other
- Status: pending, dispatched, completed, cancelled
- Stores location, description, counters for responder progress
- Relationships: belongs to User (creator), has many Dispatches, has many Calls

**Dispatches** - Junction table linking responders to incidents
- Tracks assignment workflow: assigned → accepted → en_route → arrived → completed/cancelled
- Stores distance/ETA calculated via OpenRouteService API
- Unique constraint: `[incident_id, responder_id]` prevents duplicate assignments
- Relationships: belongs to Incident, belongs to User (responder), belongs to User (assigned admin)

**Calls** - Voice call records
- Links to Agora RTC channel for real-time voice
- Tracks call lifecycle: active/ended, timestamps for start/answer/end
- Relationships: belongs to Incident, belongs to User (caller), belongs to User (admin receiver)

### API Design Pattern

**Mobile API** (`/api/*`):
```json
// Standard response format
{
  "message": "Success/Error description",
  "data": { /* payload */ },
  "errors": { /* validation errors */ }
}
```

All protected endpoints require: `Authorization: Bearer {token}`

**Web Routes** (`/admin/*`, `/user/*`):
- Inertia.js responses with React components
- Server-side rendering available via SSR mode
- Pages auto-resolved from `resources/js/pages/**/*.tsx`

### Core Services

**DispatchService** (`app/Services/DispatchService.php`)
- Central business logic for responder assignment
- Filters available responders (verified, on-duty, with GPS location)
- Integrates with DistanceCalculationService for optimal assignment
- Manages dispatch status transitions

**DistanceCalculationService** (`app/Services/DistanceCalculationService.php`)
- Integrates with OpenRouteService API for real-world routing
- Calculates road distance (not crow-flies) and travel time
- Sorts responders by proximity to incident

**VerificationService** (`app/Services/VerificationService.php`)
- Generates time-limited verification codes for email verification
- Used in registration flow for mobile app users

### Frontend Architecture

**Page Structure**:
- `resources/js/pages/Admin/*` - Admin dashboard, dispatch, live map, reports, people management
- `resources/js/pages/User/*` - User dashboard (minimal usage)
- `resources/js/pages/Auth/*` - Login, register

**Components**: Reusable UI components in `resources/js/components/`
- Mix of Shadcn/ui components and custom components
- Located in `ui/` subdirectory for Radix UI primitives

**Styling**:
- Tailwind CSS 4 with custom configuration
- Dark mode is DISABLED (forced light mode in `app.tsx`)
- Global styles in `resources/css/app.css`

### External Integrations

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Agora RTC SDK | Voice calls between mobile and admin | `config/services.php` |
| OpenRouteService | Distance/routing calculations | DistanceCalculationService |
| Google OAuth | Social login | `config/services.php`, Laravel Socialite |
| Gmail SMTP | Email verification/notifications | `config/mail.php` |

### Real-time Features

**GPS Tracking**:
- Mobile: `POST /api/responder/location` updates current_latitude/current_longitude
- Admin Live Map polls this data to display responder positions

**Dispatch Updates**:
- Mobile: `POST /api/responder/dispatches/{id}/status` transitions dispatch status
- Admin dashboard reflects changes via periodic polling or page refresh

**Voice Calls**:
- Mobile initiates: `POST /api/call/start` creates Call with Agora channel
- Admin answers: `POST /api/call/answer` joins channel
- Both sides use Agora RTC SDK for WebRTC connection

### Authentication Middleware

- `AdminMiddleware` - Requires `user_role === 'admin'` for web routes
- `UserMiddleware` - Requires authenticated user for web routes
- `GuestMiddleware` - Prevents logged-in users from accessing auth pages
- `auth:sanctum` - Validates Bearer token for API routes

## Important Implementation Notes

### Location Data Format
The IncidentController supports both flat and nested location formats:
```json
// Flat format
{ "latitude": 14.5995, "longitude": 120.9842, "address": "..." }

// Nested format
{ "location": { "latitude": 14.5995, "longitude": 120.9842, "address": "..." } }
```

### Responder Availability Logic
A responder is considered "available" for dispatch when:
1. Email is verified (`email_verified === true`)
2. Currently on duty (`is_on_duty === true`)
3. Not already assigned to an active incident (no pending/active dispatches)
4. Has GPS location data (current_latitude/current_longitude not null)

### Concurrent Development
The `composer run dev` command runs 4 processes concurrently:
1. PHP development server (port 8000)
2. Queue listener for async jobs
3. Laravel Pail for real-time log tailing
4. Vite dev server for HMR

### SSR Considerations
When using SSR mode (`composer run dev:ssr`):
- Frontend is pre-rendered on the server via `resources/js/ssr.tsx`
- Vite build process creates both client and SSR bundles
- SSR process runs via `php artisan inertia:start-ssr`

### User Role Confusion Warning
Note: This system has TWO separate role systems:
- `role` field: Mobile app roles (responder/community)
- `user_role` field: Web app roles (admin/user)

