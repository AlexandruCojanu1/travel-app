import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Custom error monitoring endpoint
 * Stores errors in database or logs them for analysis
 * This is a free alternative to Sentry
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

    // TODO: Store in database for analysis
    // You can create an errors table in Supabase:
    // CREATE TABLE error_logs (
    //   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    //   message TEXT,
    //   error_data JSONB,
    //   context JSONB,
    //   url TEXT,
    //   user_agent TEXT,
    //   created_at TIMESTAMP DEFAULT NOW()
    // );

    // For now, just log to console (Vercel Logs will capture this)
    // In production, you can:
    // 1. Store in Supabase errors table
    // 2. Send email notifications for critical errors
    // 3. Use Vercel Logs (included in Vercel plan)
    // 4. Use Better Stack (free tier available)

    return NextResponse.json({ success: true })
  } catch (error) {
    // Don't fail if error monitoring fails
    logger.error('Error monitoring endpoint failed', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

