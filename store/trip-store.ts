import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { createOrUpdateTrip, fetchUserTrip, deleteTrip, type CreateTripDTO } from '@/services/trip/trip.service'

export interface TripDetails {
  cityId: string
  cityName?: string
  startDate: string // ISO date string
  endDate: string // ISO date string
  title?: string
  guests: number
  metadata?: Record<string, any>
}

export interface TripItem {
  id: string
  business_id: string
  business_name?: string
  business_category?: string
  estimated_cost: number
  day_index: number // 0-based day index
  block?: string // morning, afternoon, evening
  created_at?: string
}

export interface Budget {
  total: number
  currency: 'RON' | 'EUR' | 'USD'
}

export type BudgetHealth = 'healthy' | 'warning' | 'critical'
export type SyncStatus = 'synced' | 'saving' | 'error'

interface TripState {
  tripDetails: TripDetails | null
  budget: Budget | null
  items: TripItem[]
  tripId: string | null // Database trip ID
  syncStatus: SyncStatus

  // Actions
  initTrip: (details: TripDetails, budget: Budget, tripId: string | null) => void
  addItem: (business: { id: string; name?: string; category?: string; price_level?: string }, dayIndex: number) => Promise<void>
  removeItem: (itemId: string) => void
  updateBudget: (newTotal: number) => void
  clearTrip: () => void
  deleteCurrentTrip: () => Promise<void>
  reorderItems: (dayIndex: number, newItemIds: string[]) => void
  syncToDatabase: () => Promise<void>
  loadTripFromDatabase: (tripId?: string) => Promise<void>
  setSyncStatus: (status: SyncStatus) => void

  // Computed/Selectors
  spentBudget: () => number
  remainingBudget: () => number
  budgetHealth: () => BudgetHealth
  getDaysCount: () => number
  getItemsByDay: (dayIndex: number) => TripItem[]
  changeItemDay: (itemId: string, newDayIndex: number) => void
}

/**
 * Map price level to estimated cost in RON
 */
function getPriceFromLevel(priceLevel: string | undefined): number {
  const priceMap: Record<string, number> = {
    '€': 50,        // Level 1
    '€€': 150,      // Level 2
    '€€€': 400,     // Level 3
    'Free': 0,
  }

  return priceMap[priceLevel || '€€'] || 150 // Default to €€ if unknown
}

export const useTripStore = create<TripState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        tripDetails: null,
        budget: null,
        items: [],
        tripId: null,
        syncStatus: 'synced' as SyncStatus,

        setSyncStatus: (status) => {
          set({ syncStatus: status })
        },

        initTrip: (details, budget, tripId) => {
          set({
            tripDetails: { ...details, metadata: details.metadata || {} },
            budget,
            items: [],
            tripId: tripId || null,
            syncStatus: 'synced',
          })
        },

        addItem: async (business, dayIndex) => {
          const state = get()

          // Check if this activity already exists in this day
          const existingItem = state.items.find(
            (item) => item.day_index === dayIndex && item.business_id === business.id
          )

          if (existingItem) {
            // Item already exists in this day - don't add duplicate
            throw new Error('Această activitate există deja în această zi')
          }

          // For Nature reserves, always set cost to 0 (but NOT for general Activities)
          const isNatureResult = business.category === 'Nature' ||
            business.id?.startsWith('nature-') ||
            business.id?.startsWith('recreation-')

          const basePrice = isNatureResult ? 0 : getPriceFromLevel(business.price_level)
          const guests = state.tripDetails?.guests || 2
          const estimatedCost = basePrice * guests

          const newItem: TripItem = {
            id: `${Date.now()}-${Math.random()}`,
            business_id: business.id,
            business_name: business.name,
            business_category: business.category,
            estimated_cost: estimatedCost,
            day_index: dayIndex,
            block: 'morning', // Default block
            created_at: new Date().toISOString(),
          }

          set({
            items: [...state.items, newItem],
          })

          // Sync immediately to database to prevent item from disappearing
          if (state.tripDetails && state.budget) {
            await state.syncToDatabase()
          }
        },

        removeItem: (itemId) => {
          set((state) => ({
            items: state.items.filter((item) => item.id !== itemId),
          }))
        },

        updateBudget: (newTotal) => {
          set((state) => ({
            budget: state.budget
              ? { ...state.budget, total: newTotal }
              : { total: newTotal, currency: 'RON' },
          }))
        },

        clearTrip: () => {
          set({
            tripDetails: null,
            budget: null,
            items: [],
            tripId: null,
          })
        },

        deleteCurrentTrip: async () => {
          const state = get()
          if (state.tripId) {
            await deleteTrip(state.tripId)
          }
          set({
            tripDetails: null,
            budget: null,
            items: [],
            tripId: null,
          })
        },

        reorderItems: (dayIndex, newItemIds) => {
          set((state) => {
            // Separate items by day
            const itemsForDay = state.items.filter(
              (item) => item.day_index === dayIndex
            )
            const itemsOtherDays = state.items.filter(
              (item) => item.day_index !== dayIndex
            )

            // Create a map for quick lookup
            const itemMap = new Map(itemsForDay.map((item) => [item.id, item]))

            // Reorder items based on newItemIds array
            const reorderedItems = newItemIds
              .map((id) => itemMap.get(id))
              .filter((item): item is TripItem => item !== undefined)

            // Combine with items from other days
            return {
              items: [...itemsOtherDays, ...reorderedItems],
            }
          })
        },

        changeItemDay: (itemId, newDayIndex) => {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, day_index: newDayIndex } : item
            ),
          }))
        },

        // Computed values
        spentBudget: () => {
          const state = get()
          return state.items.reduce((sum, item) => sum + item.estimated_cost, 0)
        },

        remainingBudget: () => {
          const state = get()
          if (!state.budget) return 0
          return state.budget.total - state.spentBudget()
        },

        budgetHealth: () => {
          const state = get()
          if (!state.budget) return 'healthy'

          const spent = state.spentBudget()
          const total = state.budget.total
          const percentage = (spent / total) * 100

          if (percentage >= 100) return 'critical'
          if (percentage >= 80) return 'warning'
          return 'healthy'
        },

        getDaysCount: () => {
          const state = get()
          if (!state.tripDetails) return 0

          const start = new Date(state.tripDetails.startDate)
          const end = new Date(state.tripDetails.endDate)
          const diffTime = Math.abs(end.getTime() - start.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          return diffDays + 1 // Inclusive of both start and end dates
        },

        getItemsByDay: (dayIndex) => {
          const state = get()
          return state.items.filter((item) => item.day_index === dayIndex)
        },

        syncToDatabase: async () => {
          const state = get()

          if (!state.tripDetails || !state.budget) {
            return // Nothing to sync
          }

          set({ syncStatus: 'saving' })

          try {
            const tripData: CreateTripDTO = {
              title: state.tripDetails.title || `Trip to ${state.tripDetails.cityName || 'Destination'}`,
              destination_city_id: state.tripDetails.cityId,
              start_date: state.tripDetails.startDate,
              end_date: state.tripDetails.endDate,
              budget_total: state.budget.total,
              status: 'planning' as const,
              guests: state.tripDetails.guests || 2,
              metadata: state.tripDetails.metadata
            }

            const result = await createOrUpdateTrip(tripData, state.items as any, state.tripId || undefined)

            if (result.success && result.tripId) {
              set({
                syncStatus: 'synced',
                tripId: result.tripId,
              })
            } else {
              set({ syncStatus: 'error' })
              console.error('Sync error:', result.error)
            }
          } catch (error) {
            set({ syncStatus: 'error' })
            console.error('Sync error:', error)
          }
        },

        loadTripFromDatabase: async (tripId) => {
          try {
            const currentState = get()
            const result = await fetchUserTrip(tripId)

            if (result.success && result.trip) {
              const trip = result.trip

              // Map database items
              interface DatabaseTripItem {
                id?: string
                business_id: string
                business_name?: string
                business_category?: string
                estimated_cost?: number
                day_index: number
              }

              const dbItems: TripItem[] = ((trip.items as DatabaseTripItem[]) || []).map((item: DatabaseTripItem) => {
                // Fix: Nature reserves should always be free
                const isNatureReserve = item.business_category === 'Nature' ||
                  item.business_name?.includes('Rezervație') ||
                  item.business_name?.includes('Peștera') ||
                  item.business_name?.includes('Dealul') ||
                  item.business_id?.startsWith('nature-')
                const estimatedCost = isNatureReserve ? 0 : (item.estimated_cost || 0)

                return {
                  id: item.id || `${Date.now()}-${Math.random()}`,
                  business_id: item.business_id,
                  business_name: item.business_name || (item as any).business?.name,
                  business_category: item.business_category || (item as any).business?.category,
                  estimated_cost: estimatedCost,
                  day_index: item.day_index,
                  block: (item as any).block || 'morning',
                  created_at: item.id ? undefined : new Date().toISOString(),
                }
              })

              // Merge local items with database items
              // Keep local items that aren't in database yet (by business_id + day_index)
              const localItemsNotInDb = currentState.items.filter(
                (localItem) => !dbItems.some(
                  (dbItem) => dbItem.business_id === localItem.business_id &&
                    dbItem.day_index === localItem.day_index
                )
              )

              // Combine: database items + local items that aren't in database yet
              const mergedItems = [...dbItems, ...localItemsNotInDb]

              set({
                tripDetails: {
                  cityId: (trip as any).city_id || trip.destination_city_id,
                  cityName: trip.title, // We'll need to fetch city name separately if needed
                  startDate: trip.start_date,
                  endDate: trip.end_date,
                  title: trip.title,
                  guests: trip.guests || 2,
                  metadata: trip.metadata || {}
                },
                budget: trip.budget_total
                  ? { total: trip.budget_total, currency: 'RON' }
                  : null,
                items: mergedItems,
                tripId: trip.id,
                syncStatus: 'synced',
              })
            }
          } catch (error) {
            console.error('Error loading trip:', error)
            set({ syncStatus: 'error' })
          }
        },
      }),
      {
        name: 'travel-trip-storage',
        partialize: (state) => ({
          tripDetails: state.tripDetails,
          budget: state.budget,
          items: state.items,
          tripId: state.tripId,
        }),
      }
    )
  )
)

// Auto-save middleware: Debounced sync on changes
let syncTimeout: NodeJS.Timeout | null = null

useTripStore.subscribe(
  (state) => [state.tripDetails, state.budget, state.items],
  () => {
    // Clear existing timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout)
    }

    // Set new timeout for debounced sync
    syncTimeout = setTimeout(() => {
      const state = useTripStore.getState()
      if (state.tripDetails && state.budget) {
        state.syncToDatabase()
      }
    }, 2000) // 2000ms debounce
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
)

