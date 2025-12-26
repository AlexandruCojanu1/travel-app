"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plane, ChevronDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CitySelector } from "./city-selector"
import { useAppStore } from "@/store/app-store"

const navLinks = [
  { label: "Home", href: "/home" },
  { label: "Explore", href: "/explore" },
  { label: "Plan", href: "/plan" },
  { label: "Bookings", href: "/bookings" },
  { label: "Profile", href: "/profile" },
]

export function Header() {
  const pathname = usePathname()
  const { currentCity, openCitySelector } = useAppStore()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by ensuring client-side state
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/75 border-b border-slate-200/50">
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            {/* Left Side - Logo & City Selector */}
            <div className="flex items-center gap-3">
              {/* Logo */}
              <Link href="/home" className="flex items-center gap-2 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
                  <Plane className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
              </Link>

              {/* City Selector Trigger */}
              <button
                onClick={openCitySelector}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors group"
              >
                <MapPin className="h-4 w-4 text-slate-600 group-hover:text-blue-600 transition-colors" />
                <span 
                  className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
                  suppressHydrationWarning
                >
                  {mounted ? (currentCity?.name || "Select City") : "Select City"}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>

          {/* Desktop Navigation Links - Hidden on Mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href

              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User Avatar - Always Visible */}
          <Link href="/profile">
            <Avatar className="h-9 w-9 ring-2 ring-slate-200 hover:ring-blue-400 transition-all cursor-pointer">
              <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                JD
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>

    {/* City Selector Modal - Only render on client */}
    {mounted && <CitySelector />}
  </>
  )
}
