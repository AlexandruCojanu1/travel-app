"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar"
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
        "sticky top-0 z-[100] w-full transition-all duration-300",
        "bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm md:border-none md:shadow-none md:bg-transparent md:pointer-events-none"
      )}>
        <div className="w-full">
          {/* Desktop Navigation Group (Centered) */}
          {/* Desktop Navigation Group (Centered) */}
          <div className="hidden md:flex md:pointer-events-auto fixed top-1 left-1/2 -translate-x-1/2 z-[100] items-center">

            {/* Main Pill Container */}
            <nav className="relative h-[72px] pl-10 pr-3 rounded-full flex items-center gap-10 bg-primary/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">

              {/* Artistic Background Pattern */}
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
                style={{
                  backgroundImage: `url('/images/travel-pattern.svg')`,
                  backgroundSize: '300px',
                  backgroundRepeat: 'repeat'
                }}
              />

              {/* Navigation Links */}
              <div className="flex items-center gap-8 relative z-10">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/home' && pathname.startsWith(link.href))

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "text-sm font-bold tracking-[0.15em] uppercase transition-all duration-300 relative group",
                        isActive
                          ? "text-accent"
                          : "text-white/60 hover:text-white"
                      )}
                    >
                      {link.label}
                      {isActive && (
                        <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-accent rounded-full shadow-[0_0_12px_rgba(231,241,168,0.6)]" />
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Avatar Circle (Inside Pill) */}
              <Link href="/profile" className="ml-2 relative z-10">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-lg shadow-inner ring-4 ring-white/10 hover:scale-105 transition-transform">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="rounded-full object-cover h-full w-full"
                    />
                  ) : (
                    <span>{userInitials}</span>
                  )}
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
