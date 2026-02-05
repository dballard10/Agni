import { useState, useEffect, useCallback } from 'react'
import { platform } from '@/shared/lib/platform'

/**
 * React hook for platform-aware components
 *
 * EXAMPLE:
 *   function ExportButton() {
 *     const { isDesktop, desktop, openExternal } = usePlatform()
 *
 *     const handleExport = async () => {
 *       if (isDesktop && desktop) {
 *         const path = await desktop.dialog.showSaveDialog({
 *           defaultPath: 'export.json'
 *         })
 *         if (path) { ... }
 *       } else {
 *         // Browser fallback: download via blob
 *       }
 *     }
 *   }
 */
export function usePlatform() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!platform.desktop) return

    // Initialize maximized state
    platform.desktop.window.isMaximized().then(setIsMaximized)

    // Subscribe to changes
    const unsubscribe = platform.desktop.window.onMaximizeChange(setIsMaximized)
    return unsubscribe
  }, [])

  const openExternal = useCallback((url: string) => {
    return platform.openExternal(url)
  }, [])

  return {
    isDesktop: platform.isDesktop,
    isBrowser: platform.isBrowser,
    isMobile: platform.isMobile,
    desktop: platform.desktop,
    isMaximized,
    openExternal,
  }
}

/**
 * Hook for window controls (frameless window)
 */
export function useWindowControls() {
  const { desktop, isMaximized } = usePlatform()

  const minimize = useCallback(() => desktop?.window.minimize(), [desktop])
  const maximize = useCallback(() => desktop?.window.maximize(), [desktop])
  const close = useCallback(() => desktop?.window.close(), [desktop])

  if (!desktop) return null

  return { minimize, maximize, close, isMaximized }
}
