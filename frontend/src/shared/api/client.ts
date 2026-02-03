/**
 * Generic HTTP API client for backend requests.
 * Domain-specific API endpoints should live in their respective entity/feature folders.
 */

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

/**
 * Generic fetch wrapper with JSON handling and error management.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API error [${res.status}] ${path}:`, errorText);
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
