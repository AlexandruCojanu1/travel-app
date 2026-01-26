/**
 * Gamification Types
 * Type definitions for gamification features (achievements, quests, badges)
 */

export interface QuestStep {
  step_number: number
  title: string
  description?: string
  trigger_event: string
  conditions?: Record<string, unknown>
  reward?: {
    xp?: number
    coins?: number
  }
}

export interface Quest {
  id: string
  quest_name: string
  quest_description: string | null
  quest_slug: string
  steps: QuestStep[]
  quest_type: 'linear' | 'parallel' | 'choice'
  completion_xp: number
  completion_coins: number
  icon_url: string | null
  banner_image_url: string | null
  time_limit_days?: number | null
  is_repeatable?: boolean
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
}

export interface UserQuest {
  id: string
  quest_id: string
  current_step: number
  progress: Record<string, boolean>
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned'
  started_at: string
  completed_at: string | null
  expires_at: string | null
  quest?: Quest
}

export interface Achievement {
  id: string
  slug: string
  name: string
  description: string
  criteria: Record<string, unknown>
  icon_url: string | null
  tier: 'bronze' | 'silver' | 'gold'
  unlocked_at?: string
  progress?: number
  unlocked?: boolean
}

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean
  unlocked_at?: string
  progress?: number
}

export interface UserPassport {
  profile: {
    full_name: string | null
    level: number
    xp: number
    next_threshold: number
    avatar_url?: string
  }
  badges: Array<{
    id: string
    badge_name: string
    badge_description: string | null
    icon_url: string | null
    unlocked_at: string
  }>
}
