/**
 * Platform abstraction singleton for the web app
 *
 * USAGE:
 *   import { platform } from '@/shared/lib/platform'
 *
 *   if (platform.isDesktop) {
 *     await platform.desktop.dialog.showSaveDialog({ ... })
 *   }
 *
 * ARCHITECTURE:
 *   - This file is the ONLY place the web app interacts with desktop features
 *   - No Electron imports - uses runtime detection
 *   - All desktop calls are optional and guarded
 */

import {
  detectPlatform,
  getDesktopAPI,
  type PlatformCapabilities,
  type DesktopAPI,
} from '@agni/platform'

class Platform {
  private _capabilities: PlatformCapabilities | null = null
  private _desktop: DesktopAPI | null | undefined = undefined

  /** Platform capabilities (lazy-initialized) */
  get capabilities(): PlatformCapabilities {
    if (!this._capabilities) {
      this._capabilities = detectPlatform()
    }
    return this._capabilities
  }

  /** Desktop API (null in browser/mobile) */
  get desktop(): DesktopAPI | null {
    if (this._desktop === undefined) {
      this._desktop = getDesktopAPI()
    }
    return this._desktop
  }

  // Convenience accessors
  get isDesktop(): boolean {
    return this.capabilities.isDesktop
  }
  get isBrowser(): boolean {
    return this.capabilities.isBrowser
  }
  get isMobile(): boolean {
    return this.capabilities.isMobile
  }
  get hasFileSystem(): boolean {
    return this.capabilities.hasFileSystem
  }

  /**
   * Open URL - uses native shell on desktop, window.open in browser
   */
  async openExternal(url: string): Promise<void> {
    if (this.desktop) {
      await this.desktop.shell.openExternal(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  /**
   * Get user data path - returns null in browser
   */
  async getUserDataPath(): Promise<string | null> {
    if (this.desktop) {
      return this.desktop.app.getPath('userData')
    }
    return null
  }
}

/** Singleton platform instance */
export const platform = new Platform()
