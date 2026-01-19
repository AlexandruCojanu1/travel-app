"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

import { Home, Map as MapIcon, User } from "lucide-react"

const navLinks = [
  { label: "Acasă", href: "/home", icon: Home },
]

export function Header() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by ensuring client-side state
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <header className={cn(
        "sticky top-0 z-[100] w-full transition-all duration-300",
        "bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm md:border-none md:shadow-none md:bg-transparent md:pointer-events-none"
      )}>
        <div className="w-full">
          {/* Desktop Navigation Group (Centered) */}
          {/* Desktop Navigation Group (Centered) */}
          <div className="hidden md:flex md:pointer-events-auto fixed top-1 left-1/2 -translate-x-1/2 z-[100] items-center">

            {/* Main Pill Container */}
            <nav className="relative h-[72px] pl-10 pr-3 rounded-full flex items-center gap-10 bg-primary/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">



              {/* Navigation Links */}
              <div className="flex items-center gap-8 relative z-10">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/home' && pathname.startsWith(link.href))

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "text-sm font-bold tracking-[0.15em] uppercase transition-all duration-300 relative group flex items-center gap-2",
                        isActive
                          ? "text-white"
                          : "text-white/70 hover:text-white"
                      )}
                    >
                      <link.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/70 group-hover:text-white")} />
                      {isActive && (
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Avatar Circle (Inside Pill) */}
              <Link href="/profile" className="ml-4 relative z-10">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-white/10 hover:scale-105 transition-transform">
                  <User className="h-5 w-5" />
                </div>
              </Link>

            </nav>
          </div>

          <div className={cn(
            "hidden items-center justify-between px-4 h-16 md:hidden", // Added hidden to hide completely
            "md:pointer-events-auto"
          )}>

            {/* Left Side - Logo (Mobile Only) */}
            <div className="flex items-center gap-4 md:hidden">
              <Link href="/home" className="flex items-center gap-2 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-airbnb bg-white shadow-airbnb transition-transform group-hover:scale-105 overflow-hidden">
                  <Image
                    src="/images/mova-logo.png"
                    alt="MOVA Logo"
                    width={40}
                    height={40}
                    priority
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>

            {/* Right Side - Mobile Avatar Only (No Notifications) */}
            <div className="flex items-center gap-3 md:hidden">
              <Link href="/profile">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-primary shadow-sm border border-gray-100">
                  <User className="h-5 w-5" />
                </div>
              </Link>
            </div>
          </div>
        </div >
      </header >

      {/* City Selector Removed */}
    </>
  )
}
