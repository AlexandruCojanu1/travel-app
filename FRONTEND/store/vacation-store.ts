import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { useAppStore, City } from './app-store'
import { awardBadgeForTripCreation } from '@/actions/gamification'
import {
    fetchUserVacations,
    createVacation as createVacationService,
    updateVacation as updateVacationService,
    deleteVacation as deleteVacationService,
    getCurrentUser,
    getCityById
} from '@/services/vacation/vacation.service'

export interface Vacation {
    id: string
    title: string
    cityId: string
    cityName: string
    startDate: string // ISO date string
    endDate: string // ISO date string
    budgetTotal: number
    currency: 'RON' | 'EUR' | 'USD'
    spotsCount: number
    status: 'planning' | 'active' | 'completed'
    coverImage?: string
    createdAt: string
    updatedAt: string
}

interface VacationState {
    vacations: Vacation[]
    activeVacationId: string | null
    isLoading: boolean
    userId: string | null // Track ownership of data
    isHydrated: boolean;
    setHydrated: (val: boolean) => void;

    // Actions
    loadVacations: () => Promise<void>
    createVacation: (vacation: Omit<Vacation, 'id' | 'createdAt' | 'updatedAt' | 'spotsCount' | 'currency'>) => Promise<{ success: boolean; vacationId?: string; error?: string }>
    updateVacation: (id: string, updates: Partial<Vacation>) => Promise<{ success: boolean; error?: string }>
    deleteVacation: (id: string) => Promise<{ success: boolean; error?: string }>
    selectVacation: (id: string) => void
    clearActiveVacation: () => void
    reset: () => void

    // Getters
    getActiveVacation: () => Vacation | null
    getVacationById: (id: string) => Vacation | null
}

export const useVacationStore = create<VacationState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                vacations: [],
                activeVacationId: null,
                isLoading: false,
                userId: null,
                isHydrated: false,
                setHydrated: (val: boolean) => set({ isHydrated: val }),
                reset: () => {
                    const currentHydrated = get().isHydrated
                    set({
                        vacations: [],
                        activeVacationId: null,
                        isLoading: false,
                        userId: null,
                        isHydrated: currentHydrated,
                    })
                },

                loadVacations: async () => {
                    const state = get()
                    if (state.isLoading) return

                    set({ isLoading: true })

                    // Set a timeout to prevent infinite loading
                    const timeoutId = setTimeout(() => {
                        set({ isLoading: false, vacations: [], userId: null })
                    }, 10000)

                    try {
                        const { user, error: authError } = await getCurrentUser()

                        if (authError || !user) {
                            clearTimeout(timeoutId)
                            set({ isLoading: false, vacations: [], userId: null })
                            return
                        }

                        // Security: Check if stored userId differs - force complete reset
                        const currentState = get()
                        if (currentState.userId && currentState.userId !== user.id) {
                            if (typeof window !== 'undefined') {
                                window.localStorage.removeItem('travel-vacation-storage')
                            }
                        }

                        const vacations = await fetchUserVacations(user.id)

                        clearTimeout(timeoutId)
                        set({ vacations, isLoading: false, userId: user.id })
                    } catch (error) {
                        console.error('[VacationStore] Error loading vacations:', error)
                        if (timeoutId) clearTimeout(timeoutId)
                        set({ isLoading: false, vacations: [] })
                    }
                },

                createVacation: async (vacationData) => {
                    try {
                        const { user } = await getCurrentUser()

                        if (!user) {
                            return { success: false, error: 'Nu ești autentificat' }
                        }

                        const newVacation = await createVacationService(vacationData, user.id)

                        set((state) => ({
                            vacations: [newVacation, ...state.vacations],
                        }))

                        awardBadgeForTripCreation().catch(err =>
                            console.error('[VacationStore] Badge award error:', err)
                        )

                        return { success: true, vacationId: newVacation.id }
                    } catch (error: any) {
                        return { success: false, error: error.message || 'Eroare neașteptată' }
                    }
                },

                updateVacation: async (id, updates) => {
                    try {
                        await updateVacationService(id, updates)

                        set((state) => ({
                            vacations: state.vacations.map((v) =>
                                v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
                            ),
                        }))

                        return { success: true }
                    } catch (error: any) {
                        return { success: false, error: error.message || 'Eroare neașteptată' }
                    }
                },

                deleteVacation: async (id) => {
                    try {
                        await deleteVacationService(id)

                        set((state) => ({
                            vacations: state.vacations.filter((v) => v.id !== id),
                            activeVacationId: state.activeVacationId === id ? null : state.activeVacationId,
                        }))

                        return { success: true }
                    } catch (error: any) {
                        return { success: false, error: error.message || 'Eroare neașteptată' }
                    }
                },

                selectVacation: (id) => {
                    const state = get()
                    const vacation = state.vacations.find((v) => v.id === id)

                    if (vacation) {
                        set({ activeVacationId: id })

                        // Sync city logic remains here as it touches AppStore
                        const syncCity = async () => {
                            const cityData = await getCityById(vacation.cityId)
                            if (cityData) {
                                useAppStore.getState().setCity(cityData as City)
                            }
                        }

                        syncCity()
                    }
                },

                clearActiveVacation: () => {
                    set({ activeVacationId: null })
                },

                getActiveVacation: () => {
                    const state = get()
                    if (!state.activeVacationId) return null
                    return state.vacations.find((v) => v.id === state.activeVacationId) || null
                },

                getVacationById: (id) => {
                    const state = get()
                    return state.vacations.find((v) => v.id === id) || null
                },
            }),
            {
                name: 'travel-vacation-storage',
                partialize: (state) => ({
                    activeVacationId: state.activeVacationId,
                    vacations: state.vacations,
                    userId: state.userId,
                }),
                onRehydrateStorage: () => (state) => {
                    state?.setHydrated(true)
                },
            }
        )
    )
)
