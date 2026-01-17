import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { useAppStore, City } from './app-store'

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

    // Actions
    loadVacations: () => Promise<void>
    createVacation: (vacation: Omit<Vacation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; vacationId?: string; error?: string }>
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

                reset: () => {
                    set({
                        vacations: [],
                        activeVacationId: null,
                        isLoading: false,
                        userId: null
                    })
                },

                loadVacations: async () => {
                    // Prevent multiple simultaneous requests
                    const state = get()
                    if (state.isLoading) {
                        console.log('[VacationStore] Already loading, skipping...')
                        return
                    }

                    console.log('[VacationStore] Starting to load vacations...')

                    // CRITICAL: Clear old data IMMEDIATELY before fetching
                    // This prevents showing stale data from another user
                    set({ isLoading: true, vacations: [] })

                    // Set a timeout to prevent infinite loading
                    const timeoutId = setTimeout(() => {
                        console.log('[VacationStore] Loading timeout - setting empty state')
                        set({ isLoading: false, vacations: [], userId: null })
                    }, 10000) // 10 second timeout

                    try {
                        const supabase = createClient()
                        console.log('[VacationStore] Getting user...')
                        const { data: { user }, error: authError } = await supabase.auth.getUser()

                        if (authError) {
                            console.log('[VacationStore] Auth error:', authError)
                            clearTimeout(timeoutId)
                            set({ isLoading: false, vacations: [], userId: null })
                            return
                        }

                        if (!user) {
                            console.log('[VacationStore] No user found - showing empty state')
                            clearTimeout(timeoutId)
                            set({ isLoading: false, vacations: [], userId: null })
                            return
                        }

                        // Security: Check if stored userId differs - force complete reset
                        const currentState = get()
                        if (currentState.userId && currentState.userId !== user.id) {
                            console.log('[VacationStore] USER CHANGED! Clearing all data for new user')
                            // Clear localStorage directly to ensure no persist leak
                            if (typeof window !== 'undefined') {
                                window.localStorage.removeItem('travel-vacation-storage')
                            }
                        }

                        console.log('[VacationStore] User found, fetching trips for user_id:', user.id)
                        const { data, error } = await supabase
                            .from('trips')
                            .select('*, cities(id, name, latitude, longitude), trip_items(count)')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })

                        console.log('[VacationStore] Query result - trips count:', data?.length, 'for user:', user.id)

                        clearTimeout(timeoutId)

                        if (error) {
                            console.error('[VacationStore] Error loading vacations:', error)
                            // If it's a 406 or missing column error, handle it gracefully
                            if (error.code === 'PGRST301' || error.message?.includes('406')) {
                                console.warn('[VacationStore] RLS or schema issue detected')
                            }
                            set({ isLoading: false, vacations: [] })
                            return
                        }

                        console.log('[VacationStore] Loaded', data?.length || 0, 'trips')
                        const vacations: Vacation[] = (data || []).map((trip: any) => ({
                            id: trip.id,
                            title: trip.title || trip.cities?.name || 'Destinație',
                            cityId: trip.city_id,
                            cityName: trip.cities?.name || 'Necunoscut',
                            startDate: trip.start_date,
                            endDate: trip.end_date,
                            budgetTotal: trip.budget_total || 0,
                            currency: 'RON',
                            spotsCount: (trip.trip_items && trip.trip_items[0]) ? trip.trip_items[0].count : 0,
                            status: trip.status || 'planning',
                            coverImage: trip.cover_image,
                            createdAt: trip.created_at,
                            updatedAt: trip.updated_at || trip.created_at,
                        }))

                        set({ vacations, isLoading: false, userId: user.id })
                        console.log('[VacationStore] Done loading vacations')
                    } catch (error) {
                        console.error('[VacationStore] Unexpected error loading vacations:', error)
                        if (timeoutId) clearTimeout(timeoutId)
                        set({ isLoading: false, vacations: [] })
                    }
                },

                createVacation: async (vacationData) => {
                    const supabase = createClient()
                    const { data: { user } } = await supabase.auth.getUser()

                    if (!user) {
                        return { success: false, error: 'Nu ești autentificat' }
                    }

                    try {
                        const { data, error } = await supabase
                            .from('trips')
                            .insert({
                                user_id: user.id,
                                city_id: vacationData.cityId,
                                title: vacationData.title,
                                start_date: vacationData.startDate,
                                end_date: vacationData.endDate,
                                budget_total: vacationData.budgetTotal,
                                status: vacationData.status || 'planning',
                            })
                            .select('*, cities(id, name)')
                            .single()

                        if (error) {
                            return { success: false, error: error.message }
                        }

                        const newVacation: Vacation = {
                            id: data.id,
                            title: data.title || (data as any).cities?.name || 'Destinație',
                            cityId: data.city_id,
                            cityName: (data as any).cities?.name || 'Necunoscut',
                            startDate: data.start_date,
                            endDate: data.end_date,
                            budgetTotal: data.budget_total || 0,
                            currency: 'RON',
                            spotsCount: 0,
                            status: (data.status as 'planning' | 'active' | 'completed') || 'planning',
                            createdAt: data.created_at,
                            updatedAt: data.updated_at || data.created_at,
                        }

                        set((state) => ({
                            vacations: [newVacation, ...state.vacations],
                        }))

                        return { success: true, vacationId: data.id }
                    } catch (error: any) {
                        return { success: false, error: error.message || 'Eroare neașteptată' }
                    }
                },

                updateVacation: async (id, updates) => {
                    const supabase = createClient()

                    try {
                        const dbUpdates: any = {
                            updated_at: new Date().toISOString(),
                        }

                        if (updates.title) dbUpdates.title = updates.title
                        if (updates.cityId) dbUpdates.city_id = updates.cityId
                        if (updates.startDate) dbUpdates.start_date = updates.startDate
                        if (updates.endDate) dbUpdates.end_date = updates.endDate
                        if (updates.budgetTotal !== undefined) dbUpdates.budget_total = updates.budgetTotal
                        if (updates.status) dbUpdates.status = updates.status

                        const { error } = await supabase
                            .from('trips')
                            .update(dbUpdates)
                            .eq('id', id)

                        if (error) {
                            return { success: false, error: error.message }
                        }

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
                    const supabase = createClient()

                    try {
                        const { error } = await supabase
                            .from('trips')
                            .delete()
                            .eq('id', id)

                        if (error) {
                            return { success: false, error: error.message }
                        }

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

                        // Sync city with app store for Explore page
                        // We need to fetch full city data
                        const syncCity = async () => {
                            const supabase = createClient()
                            const { data } = await supabase
                                .from('cities')
                                .select('*')
                                .eq('id', vacation.cityId)
                                .single()

                            if (data) {
                                useAppStore.getState().setCity(data as City)
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
                }),
            }
        )
    )
)
