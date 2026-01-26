import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Serve landing.html directly at root path (bypass Next.js processing)
  if (pathname === '/') {
    try {
      const landingHtmlPath = join(process.cwd(), 'public', 'landing.html')
      const landingHtml = readFileSync(landingHtmlPath, 'utf-8')
      
      // Return raw HTML without any Next.js processing
      return new NextResponse(landingHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-DNS-Prefetch-Control': 'on',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'origin-when-cross-origin',
        },
      })
    } catch (error) {
      // If landing.html not found, continue to normal Next.js routing
      console.error('Failed to load landing.html:', error)
    }
  }

  // For all other paths, continue with normal Next.js routing and session update
  const response = await updateSession(request)

  // Add security headers
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  }

  // Apply security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - landing.html (served directly)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|landing.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|html)$).*)',
  ],
}
