import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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
          console.log('API: Authenticated via token:', tokenUser.id)
          
          // Create a client with the token for database queries
          const tokenSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                getAll() {
                  return request.cookies.getAll()
                },
                setAll() {
                  // Not needed for token auth
                },
              },
              global: {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              },
            }
          )
          
          // Fetch businesses using token client
          const { data: businesses, error } = await tokenSupabase
            .from('businesses')
            .select('*')
            .eq('owner_user_id', tokenUser.id)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('API: Error fetching businesses:', error)
            return NextResponse.json(
              { success: false, error: error.message },
              { status: 400 }
            )
          }

          console.log('API: Found', businesses?.length || 0, 'businesses')
          return NextResponse.json({
            success: true,
            businesses: businesses || []
          })
        }
      } catch (tokenErr) {
        console.warn('API: Token auth failed, falling back to cookies:', tokenErr)
      }
    }

    // Get authenticated user from cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('API: Auth error:', userError)
      const cookieNames = request.cookies.getAll().map(c => c.name)
      console.error('API: Request cookie names:', cookieNames)
      console.error('API: Has auth token:', !!authToken)
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    console.log('API: Fetching businesses for user:', user.id)

    // Fetch user's businesses
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('API: Error fetching businesses:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    console.log('API: Found', businesses?.length || 0, 'businesses')

    return NextResponse.json({
      success: true,
      businesses: businesses || []
    })
  } catch (error: any) {
    console.error('API: Exception in getUserBusinesses:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}
