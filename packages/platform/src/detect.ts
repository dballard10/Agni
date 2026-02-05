import type { PlatformCapabilities, DesktopAPI } from './types'

/**
 * Runtime platform detection
 * No Electron imports - checks for preload-injected globals
 */
export function detectPlatform(): PlatformCapabilities {
  const isDesktop = typeof window !== 'undefined' && 'electronAPI' in window
  const isMobile =
    typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent)
  const isBrowser = !isDesktop && !isMobile && typeof window !== 'undefined'

  return {
    isDesktop,
    isBrowser,
    isMobile,
    hasFileSystem: isDesktop,
    hasNativeMenus: isDesktop,
    hasNotifications: isDesktop || 'Notification' in globalThis,
    hasAutoUpdater: isDesktop,
  }
}

/**
 * Get the desktop API if available
 * Returns null in browser/mobile environments
 */
export function getDesktopAPI(): DesktopAPI | null {
  if (typeof window !== 'undefined' && 'electronAPI' in window) {
    return (window as Window & { electronAPI: DesktopAPI }).electronAPI
  }
  return null
}

/**
 * Type guard for desktop environment
 */
export function isDesktop(): boolean {
  return getDesktopAPI() !== null
}
