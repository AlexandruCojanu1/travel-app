import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { createError } from '../middleware/error.middleware.js'

export const gamificationRouter = Router()

// Get user's passport (XP, level, coins)
gamificationRouter.get('/passport', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('xp, coins, level, passport_stamps')
      .eq('id', userId)
      .single()

    if (error) {
      throw createError(`Failed to fetch passport: ${error.message}`, 500)
    }

    res.json({
      xp: profile?.xp || 0,
      coins: profile?.coins || 0,
      level: profile?.level || 1,
      stamps: profile?.passport_stamps || [],
    })
  } catch (error) {
    next(error)
  }
})

// Get user's achievements
gamificationRouter.get('/achievements', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id

    const { data: achievements, error } = await supabaseAdmin
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

    if (error) {
      throw createError(`Failed to fetch achievements: ${error.message}`, 500)
    }

    res.json(achievements || [])
  } catch (error) {
    next(error)
  }
})

// Get available achievements
gamificationRouter.get('/achievements/available', authMiddleware, async (req, res, next) => {
  try {
    const { data: achievements, error } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('xp_reward', { ascending: false })

    if (error) {
      throw createError(`Failed to fetch available achievements: ${error.message}`, 500)
    }

    res.json(achievements || [])
  } catch (error) {
    next(error)
  }
})

// Get user's quests
gamificationRouter.get('/quests', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id

    const { data: quests, error } = await supabaseAdmin
      .from('user_quests')
      .select('*, gamification_quests(*)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) {
      throw createError(`Failed to fetch quests: ${error.message}`, 500)
    }

    res.json(quests || [])
  } catch (error) {
    next(error)
  }
})

// Get available quests
gamificationRouter.get('/quests/available', authMiddleware, async (req, res, next) => {
  try {
    const { data: quests, error } = await supabaseAdmin
      .from('gamification_quests')
      .select('*')
      .eq('is_active', true)
      .order('xp_reward', { ascending: false })

    if (error) {
      throw createError(`Failed to fetch available quests: ${error.message}`, 500)
    }

    res.json(quests || [])
  } catch (error) {
    next(error)
  }
})

// Start a quest
gamificationRouter.post('/quests/:questId/start', authMiddleware, async (req, res, next) => {
  try {
    const { questId } = req.params
    const userId = req.user!.id

    // Check if quest exists and is active
    const { data: quest, error: questError } = await supabaseAdmin
      .from('gamification_quests')
      .select('*')
      .eq('id', questId)
      .eq('is_active', true)
      .single()

    if (questError || !quest) {
      throw createError('Quest not found or inactive', 404)
    }

    // Start the quest
    const { data, error } = await supabaseAdmin
      .from('user_quests')
      .insert({
        user_id: userId,
        quest_id: questId,
        status: 'in_progress',
        progress: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('duplicate')) {
        throw createError('Quest already started', 400)
      }
      throw createError(`Failed to start quest: ${error.message}`, 500)
    }

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

// Claim check-in reward
gamificationRouter.post('/checkin', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id
    const { business_id, city_id } = req.body

    // Award XP and coins for check-in
    const XP_REWARD = 50
    const COINS_REWARD = 10

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('xp, coins, level')
      .eq('id', userId)
      .single()

    if (error) {
      throw createError(`Failed to fetch profile: ${error.message}`, 500)
    }

    const newXp = (profile?.xp || 0) + XP_REWARD
    const newCoins = (profile?.coins || 0) + COINS_REWARD
    const newLevel = Math.floor(newXp / 1000) + 1

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        xp: newXp,
        coins: newCoins,
        level: newLevel,
      })
      .eq('id', userId)

    if (updateError) {
      throw createError(`Failed to update profile: ${updateError.message}`, 500)
    }

    // Record check-in
    await supabaseAdmin
      .from('user_checkins')
      .insert({
        user_id: userId,
        business_id,
        city_id,
        xp_earned: XP_REWARD,
        coins_earned: COINS_REWARD,
      })

    res.json({
      success: true,
      rewards: {
        xp: XP_REWARD,
        coins: COINS_REWARD,
      },
      totals: {
        xp: newXp,
        coins: newCoins,
        level: newLevel,
      },
    })
  } catch (error) {
    next(error)
  }
})
