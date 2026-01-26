"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Achievement, Quest, UserQuest, QuestStep } from "@/types/gamification.types"

/**
 * Fetch user's passport data (unlocked and locked achievements)
 */
export async function getUserPassport() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            profile: {
                full_name: 'Guest Traveler',
                level: 1,
                xp: 0,
                next_threshold: 100
            },
            badges: []
        }
    }

    // 1. Fetch User Progress (XP, Level)
    const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // 2. Fetch User Profile (Name, Avatar)
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

    // 3. Fetch Badges
    const { data: userBadges } = await supabase
        .from('user_badges')
        .select('*, badge:gamification_badges(*)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })

    // If no progress record yet, use defaults (or trigger init)
    const userProfile = {
        full_name: profile?.full_name || user.email || 'Traveler',
        avatar_url: profile?.avatar_url,
        level: progress?.current_level || 1,
        xp: progress?.total_xp || 0,
        next_threshold: progress?.next_level_threshold || 100
    }

    return {
        profile: userProfile,
        badges: userBadges || []
    }
}

/**
 * Check if a location unlock is available
 * @param cityName The city name detected (e.g., 'Brașov')
 */
export async function checkLocationAchievement(cityName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    // Clean input
    const targetCity = cityName.trim()

    // Find achievement for this city
    // In a real app, we might query by criteria->>'city_name'
    // For now, let's fetch all location achievements and match in code to assume flexibility
    const { data: locationAchievements } = await supabase
        .from('achievements')
        .select('*')
    // .eq("criteria->>'type'", 'location') // This syntax requires casting in some Supabase versions, keeping it simple

    if (!locationAchievements) return { success: false }

    const matchedAchievement = locationAchievements.find(a => {
        const criteria = a.criteria as Record<string, unknown>
        const cityName = typeof criteria.city_name === 'string' ? criteria.city_name : null
        return criteria.type === 'location' &&
            cityName?.toLowerCase() === targetCity.toLowerCase()
    })

    if (!matchedAchievement) return { success: false }

    // Check if already unlocked
    const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_id', matchedAchievement.id)
        .single()

    if (existing) return { success: false, alreadyUnlocked: true }

    // Unlock!
    await supabase
        .from('user_achievements')
        .insert({
            user_id: user.id,
            achievement_id: matchedAchievement.id,
            unlocked_at: new Date().toISOString()
        })

    revalidatePath('/profile')
    return { success: true, achievement: matchedAchievement }
}

/**
 * Grant rewards (XP, Coins) to a user
 */
export async function grantRewards(
    userId: string,
    rewards: { xp: number; coins: number },
    reason: string
) {
    const supabase = await createClient()

    // 1. Update Profile (RPC is safer for atomic increments, but direct update is OK for MVP if low concurrency)
    // We'll fetch logical current values first or use a database function if available. 
    // For now, let's use a simple increment flow.

    // Fetch current
    const { data: profile } = await supabase
        .from('profiles')
        .select('xp, coins')
        .eq('id', userId)
        .single()

    if (!profile) return { error: "Profile not found" }

    const newXp = (profile.xp || 0) + rewards.xp
    const newCoins = (profile.coins || 0) + rewards.coins

    // Update
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ xp: newXp, coins: newCoins })
        .eq('id', userId)

    if (updateError) return { success: false, error: updateError.message }

    // 2. Log Transaction
    const { error: txError } = await supabase
        .from('transactions')
        .insert({
            user_id: userId,
            amount: rewards.coins, // Primary currency for transaction log usually coins
            currency: 'Coins',
            reason: reason,
            metadata: { xp_awarded: rewards.xp }
        })

    if (txError) console.error("Error logging transaction", txError)

    return { success: true }
}

/**
 * Award the "first-trip" badge when a user creates their first trip.
 * Call this after successfully creating a new trip.
 */
export async function awardBadgeForTripCreation() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    // 1. Check if user already has the 'first-trip' badge
    const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_id', 'first-trip')
        .maybeSingle()

    if (existingBadge) {
        // Already has badge
        return { success: false, alreadyAwarded: true }
    }

    // 2. Fetch the badge definition
    const { data: badge } = await supabase
        .from('gamification_badges')
        .select('id')
        .eq('slug', 'first-trip')
        .maybeSingle()

    if (!badge) {
        console.error('[Gamification] first-trip badge not found in database')
        return { success: false, error: "Badge definition not found" }
    }

    // 3. Award the badge
    const { error: insertError } = await supabase
        .from('user_badges')
        .insert({
            user_id: user.id,
            badge_id: badge.id,
            earned_at: new Date().toISOString(),
            visual_state: 'new'
        })

    if (insertError) {
        console.error('[Gamification] Error awarding badge:', insertError)
        return { success: false, error: insertError.message }
    }

    // 4. Grant XP for earning badge (optional)
    await grantRewards(user.id, { xp: 25, coins: 10 }, 'Earned first-trip badge')

    revalidatePath('/profile')
    return { success: true, badgeAwarded: 'first-trip' }
}

/**
 * Fetch all achievements with user's unlock status
 */
export async function getUserAchievements() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { achievements: [], unlockedIds: [] }
    }

    // Fetch all achievements
    const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .order('tier', { ascending: true })
        .order('created_at', { ascending: true })

    // Fetch user's unlocked achievements
    const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at, progress')
        .eq('user_id', user.id)

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])
    const achievementsWithStatus: (Achievement & { unlocked: boolean; unlocked_at?: string; progress?: number })[] = 
        (achievements || []).map(achievement => {
            const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id)
            return {
                ...achievement,
                unlocked: unlockedIds.has(achievement.id),
                unlocked_at: userAchievement?.unlocked_at,
                progress: userAchievement?.progress || 0
            }
        })

    return {
        achievements: achievementsWithStatus,
        unlockedIds: Array.from(unlockedIds)
    }
}

/**
 * Fetch user's quests (active and completed)
 */
export async function getUserQuests() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { activeQuests: [], completedQuests: [], availableQuests: [] }
    }

    // Fetch user's quests with quest details
    const { data: userQuests } = await supabase
        .from('user_quests')
        .select('*, quest:gamification_quests(*)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })

    if (!userQuests) {
        return { activeQuests: [], completedQuests: [] }
    }

    const activeQuests = userQuests.filter(uq => uq.status === 'in_progress')
    const completedQuests = userQuests.filter(uq => uq.status === 'completed')

    // Also fetch available quests that user hasn't started
    const { data: availableQuests } = await supabase
        .from('gamification_quests')
        .select('*')
        .eq('is_active', true)
        .is('start_date', null)
        .or('start_date.lte.now(),end_date.gte.now(),end_date.is.null')

    const startedQuestIds = new Set(userQuests.map(uq => uq.quest_id))
    const newQuests = (availableQuests || []).filter(q => !startedQuestIds.has(q.id))

    return {
        activeQuests: activeQuests.map(uq => ({
            ...uq,
            quest: uq.quest as Quest
        })),
        completedQuests: completedQuests.map(uq => ({
            ...uq,
            quest: uq.quest as Quest
        })),
        availableQuests: newQuests
    }
}

/**
 * Start a quest for the current user
 */
export async function startQuest(questId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    // Check if quest exists and is active
    const { data: quest } = await supabase
        .from('gamification_quests')
        .select('*')
        .eq('id', questId)
        .eq('is_active', true)
        .single()

    if (!quest) {
        return { success: false, error: "Quest not found or inactive" }
    }

    // Check if user already has this quest
    const { data: existing } = await supabase
        .from('user_quests')
        .select('id')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .maybeSingle()

    if (existing) {
        return { success: false, error: "Quest already started" }
    }

    // Calculate expiry date if time limit exists
    let expiresAt: string | null = null
    if (quest.time_limit_days) {
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + quest.time_limit_days)
        expiresAt = expiryDate.toISOString()
    }

    // Start the quest
    const { error } = await supabase
        .from('user_quests')
        .insert({
            user_id: user.id,
            quest_id: questId,
            current_step: 1,
            progress: {},
            status: 'in_progress',
            expires_at: expiresAt
        })

    if (error) {
        console.error("Error starting quest:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}
