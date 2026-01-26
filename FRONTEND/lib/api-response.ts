/**
 * Standardized API response helpers
 * Ensures consistent error handling across all API routes
 */

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string; details?: unknown }

// Alias for server actions (backward compatibility)
export type ActionResult<T = unknown> = ApiResponse<T>

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function failure(
  error: string, 
  code?: string, 
  details?: unknown
): ApiResponse<never> {
  return { 
    success: false, 
    error, 
    ...(code ? { code } : {}),
    ...(details ? { details } : {}),
  }
}

/**
 * Helper to handle errors in API routes
 */
export function handleApiError(error: unknown): ApiResponse<never> {
  if (error instanceof Error) {
    return failure(error.message, 'INTERNAL_ERROR', { stack: error.stack })
  }
  
  if (typeof error === 'string') {
    return failure(error)
  }
  
  return failure('An unexpected error occurred', 'UNKNOWN_ERROR', error)
}

