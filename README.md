# Agni Monorepo

A planner and calendar app with web, desktop, and mobile clients sharing a single backend.

## Structure

```
agni/
  apps/
    web/              # Web app (React + Vite)
    desktop/          # Desktop app (Electron)
    mobile/           # Mobile app (Expo React Native)
  packages/
    shared/           # Shared types and utilities
    api/              # Shared API client
  backend/            # FastAPI server + Supabase
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Supabase (requires Docker)

```bash
npm run supabase:start
```

### 3. Configure Backend Env

- Run `npm run supabase:status` to see local keys.
- Copy the `service_role key` into `backend/.env`:

```bash
# backend/.env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<service_role_key>
SUPABASE_ANON_KEY=<anon_key>
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### 4. Start Dev Servers

**Web + Backend** (default):

```bash
npm run dev
```

This runs:
- Web app at http://localhost:5173
- Backend API at http://127.0.0.1:8000

**Desktop + Backend**:

```bash
npm run dev:desktop+backend
```

**Individual apps**:

```bash
npm run dev:web         # Web only
npm run dev:desktop     # Desktop only
npm run dev:mobile      # Mobile only (Expo)
npm run dev:backend     # Backend only
```

### 5. Mobile Development

Mobile requires your local machine's IP address (not localhost):

1. Find your IP: `ipconfig getifaddr en0` (macOS)
2. Create `apps/mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_IP:8000
   ```
3. Add the IP to backend CORS:
   ```
   CORS_ORIGINS=http://localhost:5173,http://YOUR_IP:5173
   ```
4. Start mobile: `npm run dev:mobile`

## Building

### Web

```bash
npm run build
```

### Desktop

```bash
npm run build:desktop     # Build only
npm run package:desktop   # Build + package for distribution
```

### Mobile

```bash
cd apps/mobile
npx expo prebuild         # Generate native projects
npx eas build             # Build with EAS
```

## Supabase Commands

```bash
npm run supabase:start          # Start local Supabase
npm run supabase:stop           # Stop local Supabase
npm run supabase:status         # Show keys and ports
npm run supabase:reset          # Reset DB and apply migrations
npm run supabase:gen:types      # Generate TypeScript types
```

## Tech Stack

- **Web**: React 19, Vite, Tailwind CSS, Framer Motion
- **Desktop**: Electron, electron-vite, React
- **Mobile**: Expo, React Native, Expo Router
- **Backend**: Python 3.14, FastAPI, Uvicorn, Supabase
- **Shared**: TypeScript, @agni/shared, @agni/api

## Shared Packages

### @agni/shared

Platform-agnostic types and utilities shared across all apps:

```typescript
import { TaskRow, TaskCreate, TaskUpdate } from '@agni/shared'
```

### @agni/api

Shared API client that works on web, desktop, and mobile:

```typescript
import { initApiClient, getWeeks, createTask } from '@agni/api'

// Initialize once at app startup
initApiClient({ baseUrl: 'http://localhost:8000/api' })

// Use anywhere
const weeks = await getWeeks()
```
