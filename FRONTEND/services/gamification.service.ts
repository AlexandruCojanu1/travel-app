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

/**
 * Helper function to evaluate conditions from gamification rules
 */
function evaluateConditions(conditions: any, metadata: any, userId?: string): boolean {
    if (!conditions || typeof conditions !== 'object') return false

    const conditionType = conditions.type
    const operator = conditions.operator || 'equals'

    switch (conditionType) {
        case 'location':
            // Location-based condition
            if (operator === 'equals') {
                return metadata.city_name?.toLowerCase() === conditions.city_name?.toLowerCase()
            }
            return false

        case 'count':
            // Count-based condition (requires fetching user stats)
            // This will be handled separately as it needs async DB calls
            return false // Placeholder - handled in async evaluation

        case 'category':
            // Business category condition
            if (operator === 'equals') {
                return metadata.business_type?.toLowerCase() === conditions.business_category?.toLowerCase() ||
                       metadata.category?.toLowerCase() === conditions.business_category?.toLowerCase()
            }
            return false

        case 'always':
            // Always true condition
            return true

        default:
            return false
    }
}

/**
 * Async evaluation for count-based conditions
 */
async function evaluateCountCondition(
    conditions: any,
    userId: string,
    actionType: string,
    supabase: any
): Promise<boolean> {
    if (conditions.type !== 'count') return false

    const field = conditions.field // e.g., 'trips_created', 'bookings_made'
    const operator = conditions.operator || 'gte'
    const value = conditions.value || 0

    let count = 0

    // Fetch count based on field
    switch (field) {
        case 'trips_created':
            const { count: tripsCount } = await supabase
                .from('trips')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
            count = tripsCount || 0
            break

        case 'bookings_made':
            const { count: bookingsCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
            count = bookingsCount || 0
            break

        case 'reviews_posted':
            const { count: reviewsCount } = await supabase
                .from('reviews')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
            count = reviewsCount || 0
            break

        case 'check_ins':
            const { count: checkInsCount } = await supabase
                .from('city_checkins')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
            count = checkInsCount || 0
            break

        default:
            return false
    }

    // Evaluate operator
    switch (operator) {
        case 'gte':
            return count >= value
        case 'lte':
            return count <= value
        case 'equals':
            return count === value
        case 'gt':
            return count > value
        case 'lt':
            return count < value
        default:
            return false
    }
}

export const GamificationService = {
    /**
     * Check if a specific action triggers any rules (badges, achievements, rewards)
     * Now uses gamification_rules table for dynamic configuration
     * @param userId User ID
     * @param actionType The type of action performed (e.g., 'trip_created', 'check_in', 'booking_made')
     * @param metadata Contextual data (city info, counts, etc.)
     */
    checkBadgeEligibility: async (userId: string, actionType: string, metadata: any) => {
        const supabase = createClient()

        // 1. Fetch active rules for this event type
        const { data: rules } = await supabase
            .from('gamification_rules')
            .select('*')
            .eq('trigger_event', actionType)
            .eq('is_active', true)
            .order('priority', { ascending: false })

        if (!rules || rules.length === 0) {
            // Fallback to old badge system if no rules found
            return await GamificationService.checkLegacyBadges(userId, actionType, metadata)
        }

        const newEarnedBadges = []
        const awardedRewards = []

        // 2. Evaluate each rule
        for (const rule of rules) {
            try {
                let isEligible = false

                // Evaluate conditions
                if (rule.conditions.type === 'count') {
                    // Async evaluation for count-based conditions
                    isEligible = await evaluateCountCondition(rule.conditions, userId, actionType, supabase)
                } else {
                    // Sync evaluation for other conditions
                    isEligible = evaluateConditions(rule.conditions, metadata, userId)
                }

                if (!isEligible) continue

                // 3. Check if already awarded (for badges/achievements)
                if (rule.badge_id) {
                    const { data: owned } = await supabase
                        .from('user_badges')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('badge_id', rule.badge_id)
                        .maybeSingle()

                    if (owned) continue // Already earned
                }

                if (rule.achievement_id) {
                    const { data: owned } = await supabase
                        .from('user_achievements')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('achievement_id', rule.achievement_id)
                        .maybeSingle()

                    if (owned) continue // Already earned
                }

                // 4. Award rewards
                if (rule.xp_reward > 0 || rule.coins_reward > 0) {
                    await grantRewards(
                        userId,
                        { xp: rule.xp_reward, coins: rule.coins_reward },
                        `Rule: ${rule.rule_name}`
                    )
                    awardedRewards.push({ type: 'rewards', rule: rule.rule_name })
                }

                // 5. Award badge if specified
                if (rule.badge_id) {
                    const { data: badge } = await supabase
                        .from('gamification_badges')
                        .select('*')
                        .eq('id', rule.badge_id)
                        .single()

                    if (badge) {
                        await GamificationService.awardBadge(userId, badge)
                        newEarnedBadges.push(badge)
                    }
                }

                // 6. Award achievement if specified
                if (rule.achievement_id) {
                    const { error } = await supabase
                        .from('user_achievements')
                        .insert({
                            user_id: userId,
                            achievement_id: rule.achievement_id,
                            unlocked_at: new Date().toISOString()
                        })

                    if (!error) {
                        const { data: achievement } = await supabase
                            .from('achievements')
                            .select('*')
                            .eq('id', rule.achievement_id)
                            .single()

                        if (achievement) {
                            awardedRewards.push({ type: 'achievement', achievement })
                        }
                    }
                }
            } catch (error) {
                console.error(`Error evaluating rule ${rule.rule_name}:`, error)
            }
        }

        // 7. Check quest progress
        await GamificationService.checkQuestProgress(userId, actionType, metadata)

        return newEarnedBadges
    },

    /**
     * Legacy badge checking (fallback if no rules found)
     */
    checkLegacyBadges: async (userId: string, actionType: string, metadata: any) => {
        const supabase = createClient()

        const { data: potentialBadges } = await supabase
            .from('gamification_badges')
            .select('*')

        if (!potentialBadges) return []

        const newEarnedBadges = []

        for (const badge of potentialBadges) {
            const { data: owned } = await supabase
                .from('user_badges')
                .select('id')
                .eq('user_id', userId)
                .eq('badge_id', badge.id)
                .maybeSingle()

            if (owned) continue

            const criteria = badge.metadata as any
            let isEligible = false

            if (actionType === 'check_in' && criteria.type === 'location') {
                if (metadata.city_name?.toLowerCase() === criteria.city_name?.toLowerCase()) {
                    isEligible = true
                }
            }

            if (isEligible) {
                await GamificationService.awardBadge(userId, badge)
                newEarnedBadges.push(badge)
            }
        }

        return newEarnedBadges
    },

    /**
     * Check and update quest progress
     */
    checkQuestProgress: async (userId: string, actionType: string, metadata: any) => {
        const supabase = createClient()

        // Fetch active quests for this user
        const { data: userQuests } = await supabase
            .from('user_quests')
            .select('*, quest:gamification_quests(*)')
            .eq('user_id', userId)
            .eq('status', 'in_progress')

        if (!userQuests || userQuests.length === 0) return

        for (const userQuest of userQuests) {
            const quest = userQuest.quest as any
            if (!quest || !quest.is_active) continue

            const steps = quest.steps || []
            const currentStepNum = userQuest.current_step || 1
            const progress = userQuest.progress || {}

            // Check if current step is completed
            const currentStep = steps.find((s: any) => s.step_number === currentStepNum)
            if (!currentStep) continue

            // Check if step matches current action
            if (currentStep.trigger_event !== actionType) continue

            // Evaluate step conditions
            const stepConditions = currentStep.conditions || {}
            let stepCompleted = false

            if (Object.keys(stepConditions).length === 0) {
                // No conditions = always complete
                stepCompleted = true
            } else {
                stepCompleted = evaluateConditions(stepConditions, metadata, userId)
            }

            if (stepCompleted) {
                // Mark step as completed
                const newProgress = { ...progress, [currentStepNum]: true }

                // Award step rewards
                if (currentStep.reward) {
                    await grantRewards(
                        userId,
                        {
                            xp: currentStep.reward.xp || 0,
                            coins: currentStep.reward.coins || 0
                        },
                        `Quest Step: ${currentStep.title}`
                    )
                }

                // Check if quest is complete
                const allStepsCompleted = steps.every((s: any) => newProgress[s.step_number] === true)

                if (allStepsCompleted) {
                    // Complete quest
                    await supabase
                        .from('user_quests')
                        .update({
                            status: 'completed',
                            completed_at: new Date().toISOString(),
                            progress: newProgress
                        })
                        .eq('id', userQuest.id)

                    // Award completion rewards
                    if (quest.completion_xp > 0 || quest.completion_coins > 0) {
                        await grantRewards(
                            userId,
                            {
                                xp: quest.completion_xp || 0,
                                coins: quest.completion_coins || 0
                            },
                            `Quest Completed: ${quest.quest_name}`
                        )
                    }

                    // Award completion badge/achievement if specified
                    if (quest.completion_badge_id) {
                        const { data: badge } = await supabase
                            .from('gamification_badges')
                            .select('*')
                            .eq('id', quest.completion_badge_id)
                            .single()

                        if (badge) {
                            await GamificationService.awardBadge(userId, badge)
                        }
                    }
                } else {
                    // Update progress and move to next step
                    const nextStepNum = currentStepNum + 1
                    await supabase
                        .from('user_quests')
                        .update({
                            current_step: nextStepNum,
                            progress: newProgress
                        })
                        .eq('id', userQuest.id)
                }
            }
        }
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
