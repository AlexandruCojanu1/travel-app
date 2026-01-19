import { createClient } from "@/lib/supabase/client"
import { grantRewards } from "@/actions/gamification" // Reuse existing server action for secure writes
import { toast } from "sonner"

export interface BadgeCriteria {
    type: 'location' | 'action' | 'social' | 'streak'
    action_id?: string
    city_name?: string
    count?: number
    threshold?: number
}

export const GamificationService = {
    /**
     * Check if a specific action triggers any badges
     * @param userId User ID
     * @param actionType The type of action performed (e.g., 'trip_completed', 'check_in')
     * @param metadata Contextual data (city info, counts, etc.)
     */
    checkBadgeEligibility: async (userId: string, actionType: string, metadata: any) => {
        const supabase = createClient()

        // 1. Fetch potential badges for this action type
        // In a real app, this would query the DB for badges matching the criteria pattern.
        // For MVP/Performance, we might have a cached set or specific logic here.

        const { data: potentialBadges } = await supabase
            .from('gamification_badges')
            .select('*')
        // .contains('metadata', { trigger_action: actionType }) // Assuming metadata structure

        // Filter in memory for complex logic if needed
        if (!potentialBadges) return []

        const newEarnedBadges = []

        for (const badge of potentialBadges) {
            // Check if already earned
            const { data: owned } = await supabase
                .from('user_badges')
                .select('id')
                .eq('user_id', userId)
                .eq('badge_id', badge.id)
                .single()

            if (owned) continue // Already earned

            // Evaluate Criteria
            const criteria = badge.metadata as any
            let isEligible = false

            // Example Logic: Location Check-in
            if (actionType === 'check_in' && criteria.type === 'location') {
                if (metadata.city_name?.toLowerCase() === criteria.city_name?.toLowerCase()) {
                    isEligible = true
                }
            }

            // Example Logic: Trip Count
            if (actionType === 'trip_completed' && criteria.type === 'count') {
                // Fetch user stats
                // const { count } = ...
                // if (count >= criteria.threshold) isEligible = true
            }

            if (isEligible) {
                // Award Badge!
                await GamificationService.awardBadge(userId, badge)
                newEarnedBadges.push(badge)
            }
        }

        return newEarnedBadges
    },

    /**
     * Internal: Award a badge and its XP
     */
    awardBadge: async (userId: string, badge: any) => {
        const supabase = createClient()

        // Insert User Badge
        const { error } = await supabase
            .from('user_badges')
            .insert({
                user_id: userId,
                badge_id: badge.id,
                visual_state: 'pristine'
            })

        if (error) {
            console.error("Error awarding badge:", error)
            return
        }

        // Award XP
        if (badge.xp_value > 0) {
            await grantRewards(userId, { xp: badge.xp_value, coins: 0 }, `Badge Earned: ${badge.name}`)
        }
    },

    /**
     * Award XP manually (e.g. for small actions not tied to badges)
     */
    awardXP: async (userId: string, amount: number, reason: string) => {
        return await grantRewards(userId, { xp: amount, coins: 0 }, reason)
    },

    /**
     * Fetch Full Passport Data
     */
    getPassportData: async (userId: string) => {
        const supabase = createClient()

        // Parallel Fetch
        const [progressRes, badgesRes] = await Promise.all([
            supabase.from('user_progress').select('*').eq('user_id', userId).single(),
            supabase.from('user_badges').select('*, badge:gamification_badges(*)').eq('user_id', userId)
        ])

        return {
            progress: progressRes.data,
            badges: badgesRes.data || []
        }
    }
}
