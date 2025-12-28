import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { BusinessOwnershipService } from '@/services/business/ownership.service'
import { success, failure, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check for Authorization header as fallback
    const authHeader = request.headers.get('authorization')
    const authToken = authHeader?.replace('Bearer ', '')
    
    // Create Supabase client directly from request cookies
    // This ensures we read cookies from the actual HTTP request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            // Cookies are set via middleware, not here
            // This is just for SSR compatibility
          },
        },
      }
    )

    // If we have an auth token, use it to authenticate
    if (authToken) {
      try {
        // Use Supabase REST API to verify token and get user
        const verifyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
          }
        )
        
        if (verifyResponse.ok) {
          const tokenUser = await verifyResponse.json()
          logger.log('API: Authenticated via token', { userId: tokenUser.id })
          
          // Use centralized ownership service
          const businesses = await BusinessOwnershipService.getUserBusinessesServer(tokenUser.id)
          
          logger.log('API: Found businesses', { count: businesses.length, userId: tokenUser.id })
          return NextResponse.json(success(businesses))
        }
      } catch (tokenErr) {
        logger.warn('API: Token auth failed, falling back to cookies', { error: tokenErr })
      }
    }

    // Get authenticated user from cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      logger.error('API: Auth error', userError, {
        hasAuthToken: !!authToken,
        cookieNames: request.cookies.getAll().map(c => c.name),
      })
      return NextResponse.json(
        failure('User not authenticated', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    logger.log('API: Fetching businesses for user', { userId: user.id })

    // Use centralized ownership service
    const businesses = await BusinessOwnershipService.getUserBusinessesServer(user.id)

    logger.log('API: Found businesses', { count: businesses.length, userId: user.id })

    return NextResponse.json(success(businesses))
  } catch (error: unknown) {
    logger.error('API: Exception in getUserBusinesses', error)
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}
