"use client"

import { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react"
import { MapPin, Loader2, Navigation, Bus, LocateIcon } from "lucide-react"
import { motion } from "framer-motion"
import { useAppStore } from "@/store/app-store"
import { useSearchStore } from "@/store/search-store"
import { GlobalSearch } from "@/components/features/map/search/global-search"
import { QuickFilters } from "@/components/features/feed/quick-filters"
import { searchBusinesses, getBusinessesForMap, type MapBusiness } from "@/services/business/business.service"
import { Button } from "@/components/shared/ui/button"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Lazy load heavy map components
const MapView = lazy(() => import("@/components/features/map/map-view").then(m => ({ default: m.MapView })))
const BusinessDrawer = lazy(() => import("@/components/features/map/business-drawer").then(m => ({ default: m.BusinessDrawer })))
const NatureDrawer = lazy(() => import("@/components/features/map/nature-drawer").then(m => ({ default: m.NatureDrawer })))
const RecreationDrawer = lazy(() => import("@/components/features/map/recreation-drawer").then(m => ({ default: m.RecreationDrawer })))

export default function ExplorePage() {
  const { currentCity, openCitySelector } = useAppStore()
  const { query, filters, sortBy } = useSearchStore()
  const [businesses, setBusinesses] = useState<MapBusiness[]>([])
  const [natureReserves, setNatureReserves] = useState<Array<{
    name: string
    latitude: number
    longitude: number
    description: string
    area_hectares: number
    iucn_category: string
    reserve_type: string
  }>>([])
  const [recreationAreas, setRecreationAreas] = useState<Array<{
    name: string
    latitude: number
    longitude: number
    description: string
    category: string
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState("All")
  const [selectedBusiness, setSelectedBusiness] = useState<MapBusiness | null>(null)
  const [selectedNatureReserve, setSelectedNatureReserve] = useState<{
    name: string
    latitude: number
    longitude: number
    description: string
    area_hectares: number
    iucn_category: string
    reserve_type: string
  } | null>(null)
  const [selectedRecreationArea, setSelectedRecreationArea] = useState<{
    name: string
    latitude: number
    longitude: number
    description: string
    category: string
  } | null>(null)
  const [showSearchArea, setShowSearchArea] = useState(false)
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
  const [isLocating, setIsLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const mapViewRef = useRef<{ centerToLocation: (lat: number, lng: number) => void } | null>(null)

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
          logger.log('Explore: searchBusinesses returned', { count: results.length, cityId: currentCity.id })
          
          // Convert to MapBusiness format (only those with coordinates)
          const mapBusinesses: MapBusiness[] = results
            .filter((b) => {
              const hasCoords = b.latitude != null && b.longitude != null
              if (!hasCoords) {
                logger.warn('Explore: Business without coordinates', { businessId: b.id, businessName: b.name })
              }
              return hasCoords
            })
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
          logger.log('Explore: Converted to MapBusiness', { count: mapBusinesses.length })
          setBusinesses(mapBusinesses)
        } else {
          // Use simple category filter
          const category = activeFilter === "All" ? undefined : activeFilter
          const data = await getBusinessesForMap(currentCity.id, category)
          logger.log('Explore: getBusinessesForMap returned', { count: data.length, cityId: currentCity.id })
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

    // Nature reserves and recreation areas are already in businesses table
    // No need to load separately
    setNatureReserves([])
    setRecreationAreas([])
  }, [currentCity?.id, currentCity?.name, activeFilter, query, filters, sortBy])

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

      {/* Top Bar - Search and Filters Grouped - Below Header - Compact */}
      <div className="absolute top-16 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex flex-col gap-2">
            {/* Search Bar and Transport Button - Centered */}
            <div className="flex items-center justify-center gap-3">
              {/* Global Search Bar - Centered */}
              <div className="w-full max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlobalSearch variant="floating" />
                </motion.div>
              </div>
              
              {/* Transport and Location Buttons - On same line */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    onClick={() => setShowTransit(!showTransit)}
                    className={cn(
                      "shadow-airbnb-lg px-4 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-all cursor-pointer",
                      showTransit 
                        ? 'bg-mova-blue text-white hover:bg-[#2563EB] shadow-mova-blue/30' 
                        : 'bg-white/95 backdrop-blur-sm text-mova-dark hover:bg-white border-2 border-mova-blue/30 hover:border-mova-blue'
                    )}
                  >
                    <Bus className={cn("h-4 w-4 flex-shrink-0", showTransit ? "text-white" : "text-mova-blue")} />
                    <span className="text-sm whitespace-nowrap hidden md:inline">
                      {showTransit ? 'Ascunde Transport' : 'Transport'}
                    </span>
                    <span className="text-sm whitespace-nowrap md:hidden">
                      {showTransit ? 'Ascunde' : 'Transport'}
                    </span>
                  </Button>
                </motion.div>

                {/* My Location Button */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Button
                    onClick={() => {
                      if (!navigator.geolocation) {
                        toast.error('Geolocation nu este suportat de browser-ul tău')
                        return
                      }
                      
                      setIsLocating(true)
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords
                          // Store user location for marker
                          setUserLocation({ lat: latitude, lng: longitude })
                          // Update map center
                          setInitialCenter({ lat: latitude, lng: longitude })
                          // Also trigger map center if ref is available
                          if (mapViewRef.current) {
                            mapViewRef.current.centerToLocation(latitude, longitude)
                          }
                          setIsLocating(false)
                        },
                        (error) => {
                          logger.error('Error getting location', error)
                          toast.error('Nu am putut obține locația ta. Te rugăm să verifici permisiunile.')
                          setIsLocating(false)
                        },
                        {
                          enableHighAccuracy: true,
                          timeout: 10000,
                          maximumAge: 0,
                        }
                      )
                    }}
                    disabled={isLocating}
                    className={cn(
                      "shadow-airbnb-lg px-4 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-all cursor-pointer",
                      "bg-white/95 backdrop-blur-sm text-mova-dark hover:bg-white border-2 border-mova-blue/30 hover:border-mova-blue",
                      isLocating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 flex-shrink-0 text-mova-blue animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 flex-shrink-0 text-mova-blue" />
                    )}
                    <span className="text-sm whitespace-nowrap hidden md:inline">
                      {isLocating ? 'Se localizează...' : 'Locația mea'}
                    </span>
                    <span className="text-sm whitespace-nowrap md:hidden">
                      {isLocating ? '...' : 'Locație'}
                    </span>
                  </Button>
                </motion.div>
              </div>
            </div>
            
            {/* Quick Filters and Search Area Button - Centered */}
            <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide pb-1">
              <div className="flex items-center gap-2.5 justify-center">
                <QuickFilters
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>
              {showSearchArea && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
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

      {/* Map View */}
      {initialCenter && (
        <div className="absolute inset-0" style={{ top: '120px', bottom: '80px' }}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-mova-blue" />
            </div>
          }>
            <MapView
              ref={mapViewRef}
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
              userLocation={userLocation}
              natureReserves={natureReserves}
              recreationAreas={recreationAreas}
              onNatureReserveSelect={(reserve) => {
                setSelectedBusiness(null)
                setSelectedRecreationArea(null)
                setSelectedNatureReserve(reserve)
              }}
              onRecreationAreaSelect={(area) => {
                setSelectedBusiness(null)
                setSelectedNatureReserve(null)
                setSelectedRecreationArea(area)
              }}
            />
          </Suspense>
        </div>
      )}


      {/* Business Details Drawer */}
      <Suspense fallback={null}>
        <BusinessDrawer
          business={selectedBusiness}
          isOpen={!!selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      </Suspense>

      {/* Nature Reserve Drawer */}
      <Suspense fallback={null}>
        <NatureDrawer
          reserve={selectedNatureReserve}
          isOpen={!!selectedNatureReserve}
          onClose={() => setSelectedNatureReserve(null)}
        />
      </Suspense>

      {/* Recreation Area Drawer */}
      <Suspense fallback={null}>
        <RecreationDrawer
          area={selectedRecreationArea}
          isOpen={!!selectedRecreationArea}
          onClose={() => setSelectedRecreationArea(null)}
        />
      </Suspense>
    </div>
  )
}
