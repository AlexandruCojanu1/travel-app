import { create } from 'zustand'

interface UIState {
    isBusinessDrawerOpen: boolean
    selectedBusinessId: string | null

    // Actions
    openBusinessDrawer: (businessId: string) => void
    closeBusinessDrawer: () => void
}

export const useUIStore = create<UIState>((set) => ({
    isBusinessDrawerOpen: false,
    selectedBusinessId: null,

    openBusinessDrawer: (businessId) => {
        set({ isBusinessDrawerOpen: true, selectedBusinessId: businessId })
    },

    closeBusinessDrawer: () => {
        set({ isBusinessDrawerOpen: false, selectedBusinessId: null })
    },
}))
