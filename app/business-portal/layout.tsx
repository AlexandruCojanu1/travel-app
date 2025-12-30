"use client"

import { ReactNode } from "react"
import Link from "next/link"

export default function BusinessPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  // Business portal layout - hides root Header/BottomNav via CSS
  return (
    <>
      <style jsx global>{`
        /* Hide root layout Header and BottomNav for business portal */
        body > div > header:first-of-type,
        body > div > nav:last-of-type {
          display: none !important;
        }
        /* Remove padding from main for business portal */
        body > div > main {
          padding: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          max-width: 100% !important;
        }
        /* Remove max-width constraint */
        body > div {
          max-width: 100% !important;
        }
      `}</style>
      
      {/* Business portal header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto w-full max-w-screen-2xl">
          <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">Business Portal</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <Link
                href="/"
                className="text-xs md:text-sm text-slate-600 hover:text-slate-900 font-medium whitespace-nowrap"
              >
                <span className="hidden sm:inline">← Back to App</span>
                <span className="sm:hidden">← Back</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Business portal content */}
      <div className="w-full min-h-screen bg-slate-50">
        {children}
      </div>
    </>
  )
}
