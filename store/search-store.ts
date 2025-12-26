import { create } from "zustand"

export type SortOption = 'recommended' | 'rating_desc' | 'price_asc' | 'name_asc'

interface SearchFilters {
  categories: string[]
  amenities: string[]
  difficulty: 'easy' | 'moderate' | 'hard' | null
  priceRange: [number, number]
}

interface SearchState {
  query: string
  filters: SearchFilters
  sortBy: SortOption
  
  // Actions
  setQuery: (query: string) => void
  toggleFilter: (type: keyof SearchFilters, value: any) => void
  setSortBy: (sortBy: SortOption) => void
  resetFilters: () => void
}

const defaultFilters: SearchFilters = {
  categories: [],
  amenities: [],
  difficulty: null,
  priceRange: [0, 10000],
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  filters: defaultFilters,
  sortBy: 'recommended',

  setQuery: (query) => set({ query }),

  toggleFilter: (type, value) => {
    set((state) => {
      if (type === 'priceRange') {
        return {
          filters: {
            ...state.filters,
            priceRange: value as [number, number],
          },
        }
      }

      if (type === 'difficulty') {
        return {
          filters: {
            ...state.filters,
            difficulty: state.filters.difficulty === value ? null : (value as 'easy' | 'moderate' | 'hard'),
          },
        }
      }

      const currentArray = state.filters[type] as string[]
      const isSelected = currentArray.includes(value as string)

      return {
        filters: {
          ...state.filters,
          [type]: isSelected
            ? currentArray.filter((item) => item !== value)
            : [...currentArray, value as string],
        },
      }
    })
  },

  setSortBy: (sortBy) => set({ sortBy }),

  resetFilters: () => set({ filters: defaultFilters, sortBy: 'recommended' }),
}))

