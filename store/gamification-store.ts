import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GamificationService } from '@/services/gamification.service'

interface UserProgress {
    total_xp: number
    current_level: number
    next_level_threshold: number
    stamps_collected: number
    coins: number
}

interface UserBadge {
    id: string
    badge_id: string
    visual_state: 'pristine' | 'weathered'
    earned_at: string
    badge: {
        id: string
        name: string
        description: string
        icon_url: string
        rarity: string
    }
}

interface GamificationState {
    progress: UserProgress | null
    badges: UserBadge[]
    isLoading: boolean

    // Actions
    fetchPassport: (userId: string) => Promise<void>
    checkAction: (userId: string, actionType: string, metadata: any) => Promise<void>
}

export const useGamificationStore = create<GamificationState>()(
    persist(
        (set, get) => ({
            progress: null,
            badges: [],
            isLoading: false,

            fetchPassport: async (userId: string) => {
                set({ isLoading: true })
                try {
                    const data = await GamificationService.getPassportData(userId)

                    // Default structure if no progress row yet
                    const progress = data.progress || {
                        total_xp: 0,
                        current_level: 1,
                        next_level_threshold: 100,
                        stamps_collected: 0,
                        coins: 0
                    }

                    set({
                        progress: progress,
                        badges: data.badges as any,
                        isLoading: false
                    })
                } catch (error) {
                    console.error("Failed to fetch passport:", error)
                    set({ isLoading: false })
                }
            },

            checkAction: async (userId: string, actionType: string, metadata: any) => {
                // Optimistic checks or silent background checks
                const newBadges = await GamificationService.checkBadgeEligibility(userId, actionType, metadata)

                if (newBadges && newBadges.length > 0) {
                    // Refresh data to show new badge
                    get().fetchPassport(userId)
                }
            }
        }),
        {
            name: 'mova-gamification-storage',
            partialize: (state) => ({
                progress: state.progress,
                badges: state.badges
            }), // Persist data for offline/fast load
        }
    )
)
