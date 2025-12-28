/**
 * Rate limiting utility
 * Simple in-memory rate limiter for API routes
 * 
 * For production, consider using:
 * - Vercel Edge Config
 * - Upstash Redis
 * - Cloudflare Rate Limiting
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (resets on server restart)
// In production, use Redis or similar
const store: RateLimitStore = {}

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  identifier?: string // Custom identifier (defaults to IP)
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Simple rate limiter
 * 
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param options - Rate limit options
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { windowMs, maxRequests } = options
  const now = Date.now()
  const key = identifier

  // Get or create entry
  let entry = store[key]

  // Reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    }
    store[key] = entry
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    }
  }

  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client identifier from request
 * Tries IP address, falls back to user ID if authenticated
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if authenticated (more accurate)
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit middleware for API routes
 * 
 * Usage:
 * ```typescript
 * const result = await checkRateLimit(request, {
 *   windowMs: 60 * 1000, // 1 minute
 *   maxRequests: 10, // 10 requests per minute
 * })
 * 
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Rate limit exceeded' },
 *     { status: 429, headers: { 'Retry-After': result.retryAfter?.toString() } }
 *   )
 * }
 * ```
 */
export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
  userId?: string
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request, userId)
  return rateLimit(identifier, options)
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Strict: 5 requests per minute
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
  // Standard: 10 requests per minute
  standard: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  // Moderate: 20 requests per minute
  moderate: {
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
  // Lenient: 60 requests per minute
  lenient: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
  // Auth endpoints: 5 requests per 15 minutes
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  // Payment endpoints: 10 requests per minute
  payment: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
}

