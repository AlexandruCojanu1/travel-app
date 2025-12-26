"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Calendar, Bookmark, User } from "lucide-react"
import { motion, useAnimation } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { useTripStore } from "@/store/trip-store"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Home",
    href: "/home",
    icon: Home,
  },
  {
    label: "Explore",
    href: "/explore",
    icon: Compass,
  },
  {
    label: "Plan",
    href: "/plan",
    icon: Calendar,
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: Bookmark,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { items } = useTripStore()
  const planIconControls = useAnimation()
  const [hasNewItem, setHasNewItem] = useState(false)

  // Track items count for notification badge
  const itemsCount = items.length
  const prevItemsCountRef = useRef(itemsCount)

  // Trigger bounce animation when item is added
  useEffect(() => {
    if (itemsCount > prevItemsCountRef.current) {
      setHasNewItem(true)
      planIconControls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.4, ease: 'easeOut' },
      })
      
      // Reset badge after animation
      setTimeout(() => {
        setHasNewItem(false)
      }, 2000)
    }
    prevItemsCountRef.current = itemsCount
  }, [itemsCount, planIconControls])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block md:hidden safe-area-bottom">
      <div className="backdrop-blur-xl bg-white/85 border-t border-slate-200/50">
        <div className="mx-auto max-w-screen-xl">
          <div className="flex items-center justify-around px-2 py-2 safe-area-x">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center min-w-[64px] min-h-[56px] group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="relative">
                      <motion.div
                        animate={item.href === '/plan' ? planIconControls : {}}
                        className={cn(
                          "transition-colors duration-200",
                          isActive
                            ? "text-blue-600"
                            : "text-slate-500 group-hover:text-slate-700"
                        )}
                      >
                        <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                      </motion.div>
                      {/* Notification Badge */}
                      {item.href === '/plan' && hasNewItem && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors duration-200",
                        isActive
                          ? "text-blue-600"
                          : "text-slate-500 group-hover:text-slate-700"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
