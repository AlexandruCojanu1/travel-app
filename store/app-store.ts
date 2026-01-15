import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface City {
  id: string
  name: string
  country: string
  state_province: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean
  created_at: string
}

interface AppState {
  currentCity: City | null
  isCitySelectorOpen: boolean

  // Actions
  setCity: (city: City) => void
  openCitySelector: () => void
  closeCitySelector: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentCity: null,
      isCitySelectorOpen: false,

      setCity: (city) => {
        set({ currentCity: city, isCitySelectorOpen: false })
      },

      openCitySelector: () => {
        set({ isCitySelectorOpen: true })
      },

      closeCitySelector: () => {
        set({ isCitySelectorOpen: false })
      },
    }),
    {
      name: 'travel-app-storage',
      partialize: (state) => ({
        currentCity: state.currentCity,
      }),
    }
  )
)
