import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Creates a Supabase client for middleware
 * Used for session management in middleware.ts
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: Call getUser() to refresh the session if needed
    // This ensures cookies are updated after login
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    
    // Public paths that don't require authentication
    const publicPaths = [
        '/',
        '/auth',
        '/api',
    ]
    
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    // For API routes, always refresh session to ensure cookies are up to date
    if (pathname.startsWith('/api')) {
        // Just refresh the session - don't block API routes
        // The API route itself will handle authentication
    }
    
    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        // Preserve redirect parameter
        if (pathname !== '/auth/login') {
            url.searchParams.set('redirect', pathname)
        }
        return NextResponse.redirect(url)
    }
    
    // If user is authenticated and trying to access login/signup, redirect to home
    if (user && pathname.startsWith('/auth/login')) {
        const url = request.nextUrl.clone()
        // Check if user has businesses
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_user_id', user.id)
            .limit(1)
        
        if (businesses && businesses.length > 0) {
            url.pathname = '/business-portal/dashboard'
        } else {
            url.pathname = '/home'
        }
        return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser to loop
    // infinitely, or even cause logging out on every request.

    return supabaseResponse
}

