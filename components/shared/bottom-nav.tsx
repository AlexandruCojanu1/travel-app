"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Plus, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateTripDialog } from "@/components/features/trip/create-trip-dialog"
import { useVacationStore } from "@/store/vacation-store"

const navItems = [
  {
    label: "Acasă",
    href: "/home",
    icon: Home,
  },
  {
    label: "Creează",
    href: "#",
    icon: Plus,
    isSpecial: true,
  },
  {
    label: "Profil",
    href: "/profile",
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false)

  // Use the vacation store to handle post-creation logic if needed
  const { loadVacations } = useVacationStore()

  const handleCreateSuccess = () => {
    setIsCreateTripOpen(false)
    loadVacations()
  }

  return (
    <>
      <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 safe-area-bottom pointer-events-none md:hidden">
        <nav className="bg-white/90 backdrop-blur-xl border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[40px] px-4 py-2 flex items-center justify-around pointer-events-auto max-w-sm w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            if (item.isSpecial) {
              return (
                <button
                  key={item.label}
                  onClick={() => setIsCreateTripOpen(true)}
                  className="relative h-14 w-14 rounded-full bg-black flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg shrink-0"
                >
                  <Plus className="h-8 w-8" strokeWidth={3} />
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center justify-center h-14 px-4 rounded-full transition-all duration-300",
                  isActive ? "text-black" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className={cn("h-7 w-7", isActive ? "stroke-[2.5]" : "stroke-2")} />
              </Link>
            )
          })}
        </nav>
      </div>

      <CreateTripDialog
        isOpen={isCreateTripOpen}
        onOpenChange={setIsCreateTripOpen}
      />
    </>
  )
}
