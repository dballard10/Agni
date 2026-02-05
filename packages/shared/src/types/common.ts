/**
 * Common types shared across all platforms.
 */

/**
 * Standard API response wrapper for single items.
 */
export interface ApiResponse<T> {
  data: T
}

/**
 * Standard API response for lists.
 */
export interface ApiListResponse<T> {
  data: T[]
  total?: number
}

/**
 * Standard success response.
 */
export interface OkResponse {
  ok: boolean
}

/**
 * API error response shape.
 */
export interface ApiError {
  message: string
  code?: string
  status?: number
}
