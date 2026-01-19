"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Achievement {
    id: string
    slug: string
    name: string
    description: string
    criteria: any
    icon_url: string | null
    tier: 'bronze' | 'silver' | 'gold'
    unlocked_at?: string // If unlocked
    progress?: number
}

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
        const criteria = a.criteria as any
        return criteria.type === 'location' &&
            criteria.city_name?.toLowerCase() === targetCity.toLowerCase()
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
