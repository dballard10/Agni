/**
 * Storage abstraction interface
 *
 * CURRENT: API-backed storage (Supabase via FastAPI)
 * FUTURE: Can be swapped to filesystem/SQLite for offline-first
 *
 * This allows the same app code to work with:
 * - Remote API (browser, online desktop)
 * - Local SQLite (offline desktop, like Obsidian)
 * - Hybrid (sync between local and remote)
 */
export interface StorageProvider {
  // Generic CRUD operations
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  list<T>(prefix: string): Promise<T[]>

  // Sync status (for future offline-first)
  readonly isLocal: boolean
  readonly isOnline: boolean
  sync?(): Promise<void>
}

/**
 * API-backed storage (current implementation)
 */
export interface ApiStorageConfig {
  baseUrl: string
  getAuthToken: () => Promise<string | null>
}

/**
 * File-backed storage (future Obsidian-like implementation)
 */
export interface FileStorageConfig {
  basePath: string // e.g., ~/Documents/Agni or app userData
  format: 'json' | 'markdown' // Markdown for notes, JSON for structured data
}
