/**
 * @agni/api - Platform-agnostic API client
 *
 * This package provides a typed API client that works across
 * web, desktop (Electron), and mobile (React Native) apps.
 *
 * Each platform configures the API base URL differently:
 * - Web: VITE_API_URL or /api (with Vite proxy)
 * - Desktop: Direct URL to backend
 * - Mobile: EXPO_PUBLIC_API_URL (device's network IP)
 */

export { createApiClient, type ApiClientConfig } from './client'
export * from './tasks'

// Re-export shared types for convenience
export type {
  TaskRow,
  TaskCreate,
  TaskUpdate,
  TaskLink,
  TaskLocation,
} from '@agni/shared'
