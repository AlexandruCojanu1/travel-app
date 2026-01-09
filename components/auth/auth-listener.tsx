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
                // Force hard reload to clear any other state
                // window.location.href = '/' 
                // OR simply router refresh
                router.refresh()
            } else if (event === 'SIGNED_IN') {
                console.log('[AuthListener] User signed in')
                const checkOnboarding = async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        // Check user metadata first (fastest)
                        const metadata = user.user_metadata
                        if (metadata.onboarding_completed) {
                            console.log('[AuthListener] Onboarding already completed (metadata)')
                            // Optional: Redirect to home if on login page, otherwise let them be
                            // router.push('/home') 
                        } else {
                            // Double check profile table to be sure
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('onboarding_completed')
                                .eq('id', user.id)
                                .single()

                            if (profile?.onboarding_completed) {
                                console.log('[AuthListener] Onboarding already completed (profile)')
                            } else {
                                console.log('[AuthListener] Onboarding NOT completed -> redirecting')
                                router.push('/onboarding')
                            }
                        }
                    }
                }
                checkOnboarding()
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    return null
}
