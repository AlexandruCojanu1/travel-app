"use client"

import { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react"
import { MapPin, Loader2, Navigation, Bus, LocateIcon, Search, SlidersHorizontal, ChevronRight, LayoutGrid } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store/app-store"
import { useSearchStore } from "@/store/search-store"
import { GlobalSearch } from "@/components/features/map/search/global-search"
import { QuickFilters } from "@/components/features/feed/quick-filters"
import { searchBusinesses, getBusinessesForMap, type MapBusiness } from "@/services/business/business.service"
import { Button } from "@/components/shared/ui/button"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { FilterSheet } from "@/components/features/map/search/filter-sheet"

// Lazy load heavy map components
const MapView = lazy(() => import("@/components/features/map/map-view").then(m => ({ default: m.MapView })))
const BusinessDrawer = lazy(() => import("@/components/features/map/business-drawer").then(m => ({ default: m.BusinessDrawer })))

export default function ExplorePage() {
    const { currentCity } = useAppStore()
    const { query, filters, sortBy } = useSearchStore()
    const [businesses, setBusinesses] = useState<MapBusiness[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [activeFilter, setActiveFilter] = useState("All")
    const [selectedBusiness, setSelectedBusiness] = useState<MapBusiness | null>(null)

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

    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
        // Prevent body scroll on explore page
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [])

    // Fetch businesses
    useEffect(() => {
        async function loadBusinesses() {
            if (!currentCity) return

            setIsLoading(true)
            try {
                const hasSearchQuery = query.trim().length > 0
                const hasFilters =
                    filters.categories.length > 0 ||
                    filters.amenities.length > 0 ||
                    filters.difficulty !== null ||
                    filters.priceRange[0] > 0 ||
                    filters.priceRange[1] < 10000

                if (hasSearchQuery || hasFilters) {
                    const results = await searchBusinesses(currentCity.id, filters, query, sortBy)
                    const mapBusinesses: MapBusiness[] = results
                        .filter((b) => b.latitude != null && b.longitude != null)
                        .map((b) => ({
                            id: b.id,
                            name: b.name,
                            category: b.category,
                            latitude: b.latitude!,
                            longitude: b.longitude!,
                            rating: b.rating,
                            image_url: b.image_url,
                            address: b.address,
                            price_level: b.category === 'Hotels' ? '€€€' : b.category === 'Food' ? '€€' : '€',
                        }))
                    setBusinesses(mapBusinesses)
                } else {
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

    const handleMapMove = useCallback(
        (bounds: { north: number; south: number; east: number; west: number }) => {
            setMapBounds(bounds)
            if (initialCenter) {
                const centerLat = (bounds.north + bounds.south) / 2
                const centerLng = (bounds.east + bounds.west) / 2
                const hasMoved = Math.abs(centerLat - initialCenter.lat) > 0.01 || Math.abs(centerLng - initialCenter.lng) > 0.01
                setShowSearchArea(hasMoved)
            }
        },
        [initialCenter]
    )

    const handleSearchArea = useCallback(async () => {
        if (!currentCity || !mapBounds) return
        setIsLoading(true)
        setShowSearchArea(false)
        try {
            const category = activeFilter === "All" ? undefined : activeFilter
            const data = await getBusinessesForMap(currentCity.id, category)
            setBusinesses(data)
        } catch (error) {
            logger.error("Error searching area", error)
        } finally {
            setIsLoading(false)
        }
    }, [currentCity, mapBounds, activeFilter])

    const handleLocate = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Geolocation nu este suportat')
            return
        }
        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                mapViewRef.current?.centerToLocation(pos.coords.latitude, pos.coords.longitude)
                setIsLocating(false)
            },
            () => {
                toast.error('Nu am putut obține locația')
                setIsLocating(false)
            },
            { enableHighAccuracy: true }
        )
    }, [])

    if (!currentCity) return null

    const isMobile = mounted && window.innerWidth < 768

    return (
        <div className="fixed inset-0 top-[64px] md:top-[80px] w-full overflow-hidden bg-white z-0">
            {/* Map Backdrop */}
            <div className="absolute inset-0 z-0">
                {initialCenter && (
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full bg-slate-50">
                            <Loader2 className="h-8 w-8 animate-spin text-mova-blue" />
                        </div>
                    }>
                        <MapView
                            ref={mapViewRef}
                            businesses={businesses}
                            initialLatitude={initialCenter.lat}
                            initialLongitude={initialCenter.lng}
                            initialZoom={13}
                            onBusinessSelect={setSelectedBusiness}
                            selectedBusinessId={selectedBusiness?.id || null}
                            onMapMove={handleMapMove}
                            cityName={currentCity?.name}
                            showTransit={showTransit}
                            userLocation={userLocation}
                            natureReserves={[]}
                            recreationAreas={[]}
                            onNatureReserveSelect={() => { }}
                            onRecreationAreaSelect={() => { }}
                            showNavigationControls={!isMobile}
                        />
                    </Suspense>
                )}
            </div>

            {/* Floating UI Container */}
            <div className="absolute inset-0 z-10 pointer-events-none px-4 md:px-6 lg:px-10 py-4 md:py-8 flex flex-col items-center">

                {/* Top: Search and Primary Controls */}
                <div className="w-full max-w-4xl space-y-4 pointer-events-auto">
                    <div className="flex flex-row items-center justify-center gap-2">
                        {/* Search Bar - Airbnb Style */}
                        <div className="flex-1 max-w-2xl">
                            <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-full px-3 py-0.5 md:px-4 md:py-1 flex items-center gap-2">
                                <GlobalSearch
                                    variant="floating"
                                    className="border-none shadow-none p-0 h-auto bg-transparent focus-within:ring-0 flex-1"
                                    showFilter={!isMobile}
                                    showSearchIcon={true}
                                />
                            </div>
                        </div>

                        {/* Manual Filter Toggle for Mobile */}
                        {isMobile && (
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="h-11 w-11 shrink-0 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-900 border border-slate-200"
                            >
                                <SlidersHorizontal className="h-5 w-5" />
                            </button>
                        )}

                        {/* Utility Buttons (Desktop Only) */}
                        <div className="hidden md:flex items-center gap-2">
                            <ControlBadge
                                active={showTransit}
                                onClick={() => setShowTransit(!showTransit)}
                                icon={<Bus className="h-4 w-4" />}
                                label="Transit"
                            />
                            <ControlBadge
                                active={isLocating}
                                onClick={handleLocate}
                                icon={isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateIcon className="h-4 w-4" />}
                                label="Locație"
                            />
                        </div>
                    </div>

                    {/* Filters Bar - Desktop Only */}
                    <div className="hidden md:flex items-center justify-center gap-2 md:-mt-2">
                        <QuickFilters
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                            className="bg-transparent border-none p-0"
                        />
                    </div>
                </div>

                {/* Center UI: Search Area Button */}
                <AnimatePresence>
                    {showSearchArea && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-44 md:top-36 pointer-events-auto"
                        >
                            <Button
                                onClick={handleSearchArea}
                                className="bg-slate-900 text-white hover:bg-black rounded-full shadow-2xl px-6 py-6 font-bold flex items-center gap-2 border border-white/20"
                            >
                                <Navigation className="h-4 w-4 fill-white" />
                                Caută în această zonă
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-slate-200">
                    <Loader2 className="h-3 w-3 animate-spin text-mova-blue" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Se încarcă</span>
                </div>
            )}

            {/* Mobile Utility Buttons (Bottom Right) */}
            <div className="absolute bottom-32 right-4 md:hidden z-20 space-y-3 pointer-events-auto">
                <button
                    onClick={() => setShowTransit(!showTransit)}
                    className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl border border-white/20 transition-all",
                        showTransit ? "bg-mova-blue text-white" : "bg-white text-slate-900 shadow-md"
                    )}
                >
                    <Bus className="h-6 w-6" />
                </button>
                <button
                    onClick={handleLocate}
                    className="h-12 w-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-xl border border-white/20 shadow-md"
                >
                    {isLocating ? <Loader2 className="h-6 w-6 animate-spin text-mova-blue" /> : <LocateIcon className="h-6 w-6" />}
                </button>
            </div>

            {/* Filter Sheet for Mobile */}
            <FilterSheet
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
            />

            {/* Business Details Drawer */}
            <Suspense fallback={null}>
                <BusinessDrawer
                    business={selectedBusiness}
                    isOpen={!!selectedBusiness}
                    onClose={() => setSelectedBusiness(null)}
                />
            </Suspense>
        </div>
    )
}

function ControlBadge({ active, onClick, icon, label }: { active?: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-xl font-bold text-sm border whitespace-nowrap",
                active
                    ? "bg-slate-900 text-white border-slate-900/10 shadow-slate-900/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
        >
            {icon}
            {label}
        </button>
    )
}
