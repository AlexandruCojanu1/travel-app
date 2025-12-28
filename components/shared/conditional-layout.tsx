"use client"

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { Header } from './header'
import { BottomNav } from './bottom-nav'

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

  // For business portal, auth, landing, or onboarding, render children without global layout
  if (isBusinessPortal || isAuthPage || isLandingPage || isOnboardingPage) {
    return <>{children}</>
  }

  // For regular traveler pages, render with global header and bottom nav
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
