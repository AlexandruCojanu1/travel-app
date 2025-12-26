"use client"

import { useTransition } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { logout } from "@/actions/auth"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  className?: string
  variant?: "default" | "icon"
}

export function LogoutButton({ className, variant = "default" }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className={cn(
          "flex items-center justify-center gap-2 text-slate-600 hover:text-red-600 transition-colors disabled:opacity-50",
          className
        )}
        title="Logout"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <LogOut className="h-5 w-5" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className={cn(
        "w-full bg-red-50 text-red-600 rounded-xl p-4 flex items-center justify-center gap-2 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50",
        className
      )}
    >
      {isPending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Logging out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </>
      )}
    </button>
  )
}



import { useTransition } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { logout } from "@/actions/auth"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  className?: string
  variant?: "default" | "icon"
}

export function LogoutButton({ className, variant = "default" }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className={cn(
          "flex items-center justify-center gap-2 text-slate-600 hover:text-red-600 transition-colors disabled:opacity-50",
          className
        )}
        title="Logout"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <LogOut className="h-5 w-5" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className={cn(
        "w-full bg-red-50 text-red-600 rounded-xl p-4 flex items-center justify-center gap-2 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50",
        className
      )}
    >
      {isPending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Logging out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </>
      )}
    </button>
  )
}

