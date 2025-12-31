import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Custom error monitoring endpoint
 * Stores errors in database or logs them for analysis
 * Custom error monitoring endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, error, context, timestamp, url, userAgent } = body

    // Log error for monitoring
    logger.error('Client error reported', error || message, {
      ...context,
      timestamp,
      url,
      userAgent,
    })

    // Errors are logged via logger which sends to monitoring endpoint
    // For production, consider storing in Supabase error_logs table

    return NextResponse.json({ success: true })
  } catch (error) {
    // Don't fail if error monitoring fails
    logger.error('Error monitoring endpoint failed', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

