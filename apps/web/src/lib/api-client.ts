/**
 * API Client for RAGfolio
 * Provides type-safe HTTP methods with authentication and error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'ragfolio_access_token';

// Custom error type with status code
type ApiError = Error & { status?: number };

/**
 * Type guard to check if an error is an API error with status
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'status' in error;
}

/**
 * Parse error response from backend
 * Handles FastAPI's various error response formats
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      // FastAPI validation error format: { detail: string }
      if (typeof obj.detail === 'string') {
        return obj.detail;
      }
      // FastAPI validation error array format: { detail: [{ msg: string }] }
      if (Array.isArray(obj.detail)) {
        return (
          obj.detail
            .map((item: unknown) => {
              if (typeof item === 'object' && item !== null && 'msg' in item) {
                return (item as { msg: string }).msg;
              }
              return '';
            })
            .filter(Boolean)
            .join(', ') || 'Request failed'
        );
      }
      // Generic message format
      if (typeof obj.message === 'string') {
        return obj.message;
      }
    }
  } catch {
    // JSON parsing failed, fall through to default
  }
  return response.statusText || 'Request failed';
}

// Token management
export function getStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/**
 * Core request function with authentication and error handling
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    const error: ApiError = new Error(message);
    error.status = response.status;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * API convenience methods
 */
export const api = {
  get<T>(path: string): Promise<T> {
    return apiRequest<T>(path, { method: 'GET' });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return apiRequest<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return apiRequest<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete<T = void>(path: string): Promise<T> {
    return apiRequest<T>(path, { method: 'DELETE' });
  },
};

export type { ApiError };
