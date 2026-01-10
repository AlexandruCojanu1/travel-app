"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useVacationStore } from "@/store/vacation-store"
import { useTripStore } from "@/store/trip-store"
import { useRouter } from "next/navigation"

export function AuthListener() {
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                console.log('[AuthListener] User signed out - clearing stores')
                useVacationStore.getState().reset()
                useTripStore.getState().clearTrip()

                // Explicitly clear local storage to prevent any persistence leakage
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('travel-vacation-storage')
                    window.localStorage.removeItem('travel-app-storage')
                    window.localStorage.removeItem('travel-ui-storage')
                }

                // Force hard reload to clear any other state
                window.location.href = '/'
            } else if (event === 'SIGNED_IN') {
                console.log('[AuthListener] User signed in')

                // CRITICAL: Clear any previous user data first
                // This prevents cross-user data leakage
                useVacationStore.getState().reset()
                useTripStore.getState().clearTrip()

                // Clear localStorage to prevent persist middleware from rehydrating old data
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('travel-vacation-storage')
                    window.localStorage.removeItem('travel-app-storage')
                    window.localStorage.removeItem('travel-ui-storage')
                }

                // NOTE: Do NOT redirect to onboarding here.
                // The login action and middleware already handle onboarding checks.
                // Redirecting from here causes race conditions and loops.
                console.log('[AuthListener] Stores cleared, letting normal flow continue')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    return null
}
