"use client"

import { useEffect, useState, useCallback } from "react"
import { MapPin, Loader2, Navigation, List, Map as MapIcon, Bus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store/app-store"
import { useSearchStore } from "@/store/search-store"
import { MapView } from "@/components/features/map/map-view"
import { BusinessDrawer } from "@/components/features/map/business-drawer"
import { BusinessListView } from "@/components/features/map/explore/business-list-view"
import { GlobalSearch } from "@/components/features/map/search/global-search"
import { QuickFilters } from "@/components/features/feed/quick-filters"
import { searchBusinesses, getBusinessesForMap, type MapBusiness } from "@/services/business/business.service"
import { Button } from "@/components/shared/ui/button"

export default function ExplorePage() {
  const { currentCity, openCitySelector } = useAppStore()
  const { query, filters, sortBy } = useSearchStore()
  const [businesses, setBusinesses] = useState<MapBusiness[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState("All")
  const [selectedBusiness, setSelectedBusiness] = useState<MapBusiness | null>(null)
  const [showSearchArea, setShowSearchArea] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [mapBounds, setMapBounds] = useState<{
    north: number
    south: number
    east: number
    west: number
  } | null>(null)
  const [initialCenter, setInitialCenter] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [showTransit, setShowTransit] = useState(false)

  // Fetch businesses when city, filter, search query, or filters change
  useEffect(() => {
    async function loadBusinesses() {
      if (!currentCity) return

      setIsLoading(true)
      try {
        // Use search if there's a query or active filters
        const hasSearchQuery = query.trim().length > 0
        const hasFilters =
          filters.categories.length > 0 ||
          filters.amenities.length > 0 ||
          filters.difficulty !== null ||
          filters.priceRange[0] > 0 ||
          filters.priceRange[1] < 10000

        if (hasSearchQuery || hasFilters) {
          // Use advanced search
          const results = await searchBusinesses(
            currentCity.id,
            filters,
            query,
            sortBy
          )
          // Convert to MapBusiness format (only those with coordinates)
          const mapBusinesses: MapBusiness[] = results
            .filter((b) => b.latitude && b.longitude)
            .map((b) => ({
              id: b.id,
              name: b.name,
              category: b.category,
              latitude: b.latitude!,
              longitude: b.longitude!,
              rating: b.rating,
              image_url: b.image_url,
              address: b.address,
              price_level: getPriceLevel(b.category),
            }))
          setBusinesses(mapBusinesses)
        } else {
          // Use simple category filter
          const category = activeFilter === "All" ? undefined : activeFilter
          const data = await getBusinessesForMap(currentCity.id, category)
          setBusinesses(data)
        }

        setInitialCenter({
          lat: currentCity.latitude,
          lng: currentCity.longitude,
        })
      } catch (error) {
        console.error("Error loading businesses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinesses()
  }, [currentCity?.id, activeFilter, query, filters, sortBy])

  // Helper function to get price level
  const getPriceLevel = (category: string): string => {
    const priceLevels: Record<string, string> = {
      Hotels: '€€€',
      Food: '€€',
      Activities: '€',
      Nature: 'Free',
    }
    return priceLevels[category] || '€€'
  }

  // Don't auto-open city selector - let user choose when to change city
  // The header already has a city selector button

  // Handle map movement to show "Search this area" button
  const handleMapMove = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      setMapBounds(bounds)

      // Check if user has moved significantly from initial city center
      if (initialCenter) {
        const centerLat = (bounds.north + bounds.south) / 2
        const centerLng = (bounds.east + bounds.west) / 2

        const latDiff = Math.abs(centerLat - initialCenter.lat)
        const lngDiff = Math.abs(centerLng - initialCenter.lng)

        // Show search button if moved more than ~0.01 degrees (~1km)
        const hasMoved = latDiff > 0.01 || lngDiff > 0.01
        setShowSearchArea(hasMoved)
      }
    },
    [initialCenter]
  )

  // Handle search area button click
  const handleSearchArea = useCallback(async () => {
    if (!currentCity || !mapBounds) return

    setIsLoading(true)
    setShowSearchArea(false)

    try {
      const category = activeFilter === "All" ? undefined : activeFilter
      // Note: You could implement searchBusinessesInBounds here if you want
      // For now, we'll just re-fetch with the current filter
      const data = await getBusinessesForMap(currentCity.id, category)
      setBusinesses(data)
    } catch (error) {
      console.error("Error searching area:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentCity, mapBounds, activeFilter])

  // Show city selector prompt if no city selected
  if (!currentCity) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-center max-w-md">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25">
            <MapPin className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            Choose Your Destination
          </h3>
          <p className="text-slate-600 mb-6">
            Select a city to explore amazing places and experiences on the map
          </p>
          <button
            onClick={openCitySelector}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Select City
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-700">Loading...</span>
        </div>
      )}

      {/* Global Search - Floating at top */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <GlobalSearch variant="floating" />
      </div>

      {/* Quick Filters - Below search */}
      <div className="absolute top-20 left-4 right-4 z-40">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-3">
          <QuickFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
      </div>

      {/* Search This Area Button - Appears when map is moved (only in map mode) */}
      {showSearchArea && viewMode === 'map' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40">
          <Button
            onClick={handleSearchArea}
            size="sm"
            className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl px-6 py-5 rounded-full font-semibold"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Search this area
          </Button>
        </div>
      )}

      {/* Map View - Keep mounted but hidden when in list mode */}
      {initialCenter && (
        <div className={viewMode === 'list' ? 'hidden' : ''}>
          <MapView
            businesses={businesses}
            initialLatitude={initialCenter.lat}
            initialLongitude={initialCenter.lng}
            initialZoom={12}
            bottomNavHeight={80}
            onBusinessSelect={setSelectedBusiness}
            selectedBusinessId={selectedBusiness?.id || null}
            onMapMove={handleMapMove}
            cityName={currentCity?.name}
            showTransit={showTransit}
          />
        </div>
      )}

      {/* List View - Animated */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <motion.div
            key="list-view"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 z-30 bg-white overflow-y-auto"
          >
            <BusinessListView
              businesses={businesses}
              onBusinessClick={setSelectedBusiness}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transit Toggle Button - Only show on map view */}
      {viewMode === 'map' && (
        <motion.div
          className="fixed top-20 right-4 z-40"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={() => setShowTransit(!showTransit)}
            className={`
              shadow-lg px-4 py-2 rounded-full font-semibold flex items-center gap-2
              ${showTransit 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
              }
            `}
          >
            <Bus className="h-4 w-4" />
            <span className="hidden md:inline">
              {showTransit ? 'Ascunde Transport' : 'Afișează Transport'}
            </span>
          </Button>
        </motion.div>
      )}

      {/* View Toggle Button - Floating */}
      <motion.div
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg px-6 py-3 rounded-full font-semibold flex items-center gap-2"
        >
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div
                key="list-icon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                <span>Afișează Listă</span>
              </motion.div>
            ) : (
              <motion.div
                key="map-icon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <MapIcon className="h-4 w-4" />
                <span>Afișează Hartă</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Business Details Drawer */}
      <BusinessDrawer
        business={selectedBusiness}
        isOpen={!!selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
      />
    </div>
  )
}
