/**
 * Platform-agnostic API client.
 *
 * This client doesn't make assumptions about how the base URL is configured.
 * Each platform (web/desktop/mobile) calls createApiClient() with the
 * appropriate base URL from their environment.
 */

export interface ApiClientConfig {
  /**
   * Base URL for API requests (e.g., "http://localhost:8000/api")
   */
  baseUrl: string

  /**
   * Optional default headers to include with every request.
   */
  defaultHeaders?: Record<string, string>

  /**
   * Optional custom fetch implementation (useful for React Native or testing).
   */
  fetch?: typeof fetch
}

export interface ApiClient {
  /**
   * GET request
   */
  get<T>(path: string, options?: RequestInit): Promise<T>

  /**
   * POST request with JSON body
   */
  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>

  /**
   * PATCH request with JSON body
   */
  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>

  /**
   * DELETE request
   */
  delete<T>(path: string, options?: RequestInit): Promise<T>

  /**
   * The base URL configured for this client.
   */
  baseUrl: string
}

/**
 * Create an API client with the given configuration.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, defaultHeaders = {}, fetch: fetchFn = fetch } = config

  async function request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${baseUrl}${path}`
    const res = await fetchFn(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`API error [${res.status}] ${path}:`, errorText)
      throw new Error(`API error: ${res.status} ${res.statusText}`)
    }

    // Handle empty responses (e.g., 204 No Content)
    const text = await res.text()
    if (!text) {
      return {} as T
    }

    return JSON.parse(text)
  }

  return {
    baseUrl,

    get<T>(path: string, options?: RequestInit): Promise<T> {
      return request<T>(path, { ...options, method: 'GET' })
    },

    post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
      return request<T>(path, {
        ...options,
        method: 'POST',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    },

    patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
      return request<T>(path, {
        ...options,
        method: 'PATCH',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    },

    delete<T>(path: string, options?: RequestInit): Promise<T> {
      return request<T>(path, { ...options, method: 'DELETE' })
    },
  }
}

/**
 * Default client instance - must be initialized by calling initApiClient()
 */
let _defaultClient: ApiClient | null = null

/**
 * Initialize the default API client. Call this once at app startup.
 */
export function initApiClient(config: ApiClientConfig): ApiClient {
  _defaultClient = createApiClient(config)
  return _defaultClient
}

/**
 * Get the default API client. Throws if not initialized.
 */
export function getApiClient(): ApiClient {
  if (!_defaultClient) {
    throw new Error(
      'API client not initialized. Call initApiClient() first.'
    )
  }
  return _defaultClient
}
