/**
 * API configuration for the mobile app.
 *
 * In development, use your local machine's IP address (not localhost)
 * since the mobile device/emulator can't reach localhost directly.
 *
 * Example .env setup:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
 *
 * In production, this would be your deployed backend URL:
 *   EXPO_PUBLIC_API_URL=https://api.agni.app
 */

// Expo uses EXPO_PUBLIC_ prefix for env vars exposed to the client
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'

export const API_URL = `${API_BASE_URL}/api`

/**
 * Instructions for setting up API access during development:
 *
 * 1. Find your local machine's IP address:
 *    - macOS: System Settings > Network, or run `ipconfig getifaddr en0`
 *    - Windows: Run `ipconfig` and look for IPv4 Address
 *    - Linux: Run `hostname -I`
 *
 * 2. Create a .env file in apps/mobile/:
 *    EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
 *
 * 3. Make sure your backend CORS allows requests from the mobile device.
 *    Add your machine's IP to the CORS_ORIGINS in backend/.env
 *
 * 4. Restart the Expo dev server after changing .env
 */
