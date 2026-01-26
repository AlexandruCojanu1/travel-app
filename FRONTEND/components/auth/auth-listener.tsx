"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useVacationStore } from "@/store/vacation-store"
import { useTripStore } from "@/store/trip-store"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"

export function AuthListener() {
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                logger.info('[AuthListener] User signed out - clearing stores')
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
            } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                const currentUserId = session?.user?.id
                const storedUserId = useVacationStore.getState().userId

                if (currentUserId && currentUserId === storedUserId) {
                    // console.log('[AuthListener] Session restored for same user, skipping reset')
                    // Only load if we have no data, otherwise trust persistence
                    if (useVacationStore.getState().vacations.length === 0) {
                        useVacationStore.getState().loadVacations()
                    }
                } else {
                    // console.log('[AuthListener] New user or session mismatch, resetting state')
                    useVacationStore.getState().reset()
                    useTripStore.getState().clearTrip()

                    if (currentUserId) {
                        setTimeout(() => {
                            useVacationStore.getState().loadVacations()
                        }, 0)
                    }
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    return null
}
