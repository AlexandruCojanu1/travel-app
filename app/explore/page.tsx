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
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

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
        logger.error("Error loading businesses", error)
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
      logger.error("Error searching area", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentCity, mapBounds, activeFilter])

  // Handle center map on user location
  const handleCenterMap = useCallback(() => {
    if (initialCenter) {
      setMapBounds({
        north: initialCenter.lat + 0.01,
        south: initialCenter.lat - 0.01,
        east: initialCenter.lng + 0.01,
        west: initialCenter.lng - 0.01,
      })
      // Trigger map recenter via MapView component
      // This would need to be implemented in MapView component
    }
  }, [initialCenter])

  // Show city selector prompt if no city selected
  if (!currentCity) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-center max-w-md">
          <div className="h-20 w-20 rounded-airbnb-lg bg-mova-blue flex items-center justify-center mx-auto mb-6 shadow-airbnb-lg">
            <MapPin className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-mova-dark mb-3">
            Alege Destinația
          </h3>
          <p className="text-mova-gray mb-6">
            Selectează un oraș pentru a explora locuri și experiențe uimitoare pe hartă
          </p>
          <button
            onClick={openCitySelector}
            className="airbnb-button px-8 py-4"
          >
            Selectează Oraș
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] bg-white px-4 py-2 rounded-full shadow-airbnb-md flex items-center gap-2 border border-gray-200">
          <Loader2 className="h-4 w-4 animate-spin text-mova-blue" />
          <span className="text-sm font-semibold text-mova-dark">Se încarcă...</span>
        </div>
      )}

      {/* Top Bar - Search and Filters Grouped - Below Header */}
      <div className="absolute top-16 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col gap-3">
            {/* Global Search Bar - Centered */}
            <div className="w-full max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GlobalSearch variant="floating" />
              </motion.div>
            </div>
            
            {/* Quick Filters and Search Area Button - Aligned */}
            <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide pb-1">
              <div className="flex items-center gap-2.5 flex-1 justify-center min-w-0">
                <QuickFilters
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>
              {showSearchArea && viewMode === 'map' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 ml-2"
                >
                  <Button
                    onClick={handleSearchArea}
                    size="sm"
                    className="bg-mova-blue text-white hover:bg-[#2563EB] shadow-airbnb-md px-4 py-2 rounded-full font-semibold flex items-center gap-2 whitespace-nowrap"
                  >
                    <Navigation className="h-4 w-4" />
                    <span className="text-sm hidden sm:inline">Caută în această zonă</span>
                    <span className="text-sm sm:hidden">Zonă</span>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

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

      {/* Map Controls - Right Side - Grouped and Aligned */}
      {viewMode === 'map' && (
        <div className="absolute right-4 top-[180px] z-50 flex flex-col gap-2.5">
          {/* Transport Toggle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={() => setShowTransit(!showTransit)}
              className={cn(
                "shadow-airbnb-lg px-4 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-all min-w-[120px] justify-center cursor-pointer",
                showTransit 
                  ? 'bg-mova-blue text-white hover:bg-[#2563EB] shadow-mova-blue/30' 
                  : 'bg-white/95 backdrop-blur-sm text-mova-dark hover:bg-white border-2 border-mova-blue/30 hover:border-mova-blue'
              )}
            >
              <Bus className={cn("h-4 w-4 flex-shrink-0", showTransit ? "text-white" : "text-mova-blue")} />
              <span className="text-sm whitespace-nowrap">
                {showTransit ? 'Ascunde Transport' : 'Transport'}
              </span>
            </Button>
          </motion.div>

          {/* Zoom Controls */}
          <div className="bg-white rounded-airbnb shadow-airbnb-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => {/* Zoom in logic */}}
              className="w-11 h-11 flex items-center justify-center border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Mărește"
            >
              <span className="text-lg font-semibold text-mova-dark">+</span>
            </button>
            <button
              onClick={() => {/* Zoom out logic */}}
              className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Micșorează"
            >
              <span className="text-lg font-semibold text-mova-dark">−</span>
            </button>
          </div>

          {/* Location Button */}
          <Button
            onClick={handleCenterMap}
            className="bg-white/95 backdrop-blur-sm text-mova-dark hover:bg-white border-2 border-mova-blue/30 hover:border-mova-blue shadow-airbnb-lg w-11 h-11 rounded-full p-0 flex items-center justify-center cursor-pointer"
            aria-label="Centrare pe locație"
          >
            <MapPin className="h-5 w-5 text-mova-blue" />
          </Button>
        </div>
      )}

      {/* View Toggle Button - Bottom Center */}
      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          className="bg-mova-blue text-white hover:bg-[#2563EB] shadow-airbnb-lg px-6 py-3 rounded-full font-semibold flex items-center gap-2 backdrop-blur-sm shadow-mova-blue/30"
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
                <span className="text-sm">Afișează Listă</span>
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
                <span className="text-sm">Afișează Hartă</span>
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
