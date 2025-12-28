import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint
 * Used for monitoring and deployment verification
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    services: {
      database: { status: 'unknown' as 'unknown' | 'healthy' | 'error', latency: 0 },
      stripe: { status: 'unknown' as 'unknown' | 'healthy' | 'error' },
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    },
  }

  // Check database connection
  try {
    const startTime = Date.now()
    const supabase = await createClient()
    const { error } = await supabase.from('cities').select('id').limit(1)
    const latency = Date.now() - startTime

    if (error) {
      checks.services.database = { status: 'error' as const, latency }
      checks.status = 'degraded'
      logger.error('Health check: Database error', error)
    } else {
      checks.services.database = { status: 'healthy', latency }
    }
  } catch (error) {
    checks.services.database = { status: 'error', latency: 0 }
    checks.status = 'degraded'
    logger.error('Health check: Database connection failed', error)
  }

  // Check Stripe configuration
  try {
    getStripe()
    checks.services.stripe = { status: 'healthy' }
  } catch (error) {
    checks.services.stripe = { status: 'error' }
    checks.status = 'degraded'
    logger.error('Health check: Stripe configuration error', error)
  }

  // Determine overall status
  const hasCriticalErrors = 
    checks.services.database.status === 'error' ||
    checks.services.stripe.status === 'error' ||
    !checks.environment.hasSupabaseUrl ||
    !checks.environment.hasSupabaseKey ||
    !checks.environment.hasStripeKey

  if (hasCriticalErrors) {
    checks.status = 'unhealthy'
    return NextResponse.json(checks, { status: 503 })
  }

  return NextResponse.json(checks, { status: 200 })
}

