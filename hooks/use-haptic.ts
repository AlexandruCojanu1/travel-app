"use client"

import { useCallback } from "react"

/**
 * useHaptic Hook
 * Provides tactile feedback patterns for the "MOVA Passport" experience.
 * Uses the Web Vibration API.
 */
export const useHaptic = () => {
    /**
     * Heavy Impact: Used for "stamping" the passport.
     * A single, strong vibration.
     */
    const heavyImpact = useCallback(() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(50)
        }
    }, [])

    /**
     * Soft Tick: Used for page turning or subtle interactions.
     * A very short, crisp vibration.
     */
    const softTick = useCallback(() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(5)
        }
    }, [])

    /**
     * Success Sequence: Used for Level Up or earning a major badge.
     * A rhythmic pattern: short-short-long.
     */
    const successSequence = useCallback(() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            // 10ms vibe, 50ms pause, 10ms vibe, 50ms pause, 50ms vibe
            navigator.vibrate([10, 50, 10, 50, 50])
        }
    }, [])

    /**
     * Error/Deny: Subtle double tap for negative feedback
     */
    const errorFeedback = useCallback(() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([30, 50, 30])
        }
    }, [])

    return {
        heavyImpact,
        softTick,
        successSequence,
        errorFeedback
    }
}
