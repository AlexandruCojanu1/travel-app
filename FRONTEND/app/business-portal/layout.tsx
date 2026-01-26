"use client"

import { ReactNode } from "react"

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
      
      {/* Business portal content */}
      <div className="w-full min-h-screen bg-slate-50">
        {children}
      </div>
    </>
  )
}
