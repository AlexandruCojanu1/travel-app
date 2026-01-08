"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar"
import PillNav from '../ui/pill-nav'
import { createClient } from "@/lib/supabase/client"

const navLinks = [
  { label: "Acasă", href: "/home" },
  { label: "Planifică", href: "/plan" },
  { label: "Explorează", href: "/explore" },
  { label: "Rezervări", href: "/bookings" },
]

export function Header() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [userInitials, setUserInitials] = useState("U")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Prevent hydration mismatch by ensuring client-side state
  useEffect(() => {
    setMounted(true)

    // Get user data for avatar
    async function loadUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Get initials from email or name
        const name = user.user_metadata?.full_name || user.email || 'User'
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'U'
        setUserInitials(initials)

        // Try to get avatar from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)
          .single()

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url)
        } else if (profile?.full_name) {
          // Generate avatar URL from name
          setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=6366f1&color=fff`)
        } else {
          setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`)
        }
      }
    }

    loadUserData()
  }, [])

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        "bg-white border-b border-gray-200 shadow-sm md:border-none md:shadow-none md:bg-transparent md:pointer-events-none"
      )}>
        <div className="w-full">
          {/* Desktop Navigation Group (Centered) */}
          <div className="hidden md:flex md:pointer-events-auto fixed top-6 left-1/2 -translate-x-1/2 z-[100] items-center gap-3">
            <PillNav
              items={navLinks}
              logo="/images/mova-logo.png"
              logoAlt="MOVA Logo"
              baseColor="#003CFF" // MOVA Blue Container
              pillColor="#ffffff" // White pill background
              pillTextColor="#003CFF" // Blue Text on White Pill
              hoveredPillTextColor="#ffffff" // White Text on Blue Hover Circle
            />

            {/* Desktop User Avatar - Next to PillNav */}
            <Link href="/profile" className="ml-2">
              <Avatar className="h-11 w-11 transition-all cursor-pointer rounded-full border border-white/20 shadow-xl ring-2 ring-black/5 hover:scale-105 active:scale-95">
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt="User"
                  className="object-cover"
                />
                <AvatarFallback className="bg-mova-blue text-white text-sm font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>

          <div className={cn(
            "flex items-center justify-between px-4 h-16 md:hidden",
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
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage
                    src={avatarUrl || undefined}
                    alt="User"
                  />
                  <AvatarFallback className="bg-mova-blue text-white text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* City Selector Removed */}
    </>
  )
}
