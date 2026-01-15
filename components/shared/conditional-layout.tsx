"use client"

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { Header } from './header'
import { BottomNav } from './bottom-nav'
import { Footer } from './footer'
import { BusinessDetailsDrawer } from '@/components/features/business/public/business-details-drawer'
import { cn } from '@/lib/utils'

interface ConditionalLayoutProps {
  children: ReactNode
}

/**
 * Conditional layout that shows/hides global header/footer based on route
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isBusinessPortal = pathname?.startsWith('/business-portal')
  const isAuthPage = pathname?.startsWith('/auth')
  const isLandingPage = pathname === '/'
  const isOnboardingPage = pathname === '/onboarding'

  const isHomePage = pathname === '/home' || pathname === '/plan'

  // For business portal, auth, landing, or onboarding, render children without global layout
  if (isBusinessPortal || isAuthPage || isLandingPage || isOnboardingPage) {
    return <>{children}</>
  }

  // For regular traveler pages, render with global header and bottom nav
  return (
    <>
      <Header />
      <main className={cn(
        "min-h-screen w-full flex flex-col pt-16 md:pt-20",
        isHomePage && "pb-32 md:pb-0",
        pathname === '/explore' && "h-screen overflow-hidden pb-0"
      )}>
        <div className={cn("flex-1 w-full", pathname === '/explore' && "overflow-hidden")}>
          {children}
        </div>
        {!isLandingPage && !isOnboardingPage && !isAuthPage && !pathname?.startsWith('/explore') && (
          <div className="hidden">
            {/* Footer Removed as per UX request */}
          </div>
        )}
      </main>
      <BottomNav />
      <BusinessDetailsDrawer />
    </>
  )
}
