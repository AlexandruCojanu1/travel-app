"use client"

import { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react"
import { Loader2 } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useSearchStore } from "@/store/search-store"
import { searchBusinesses, getBusinessesForMap, type MapBusiness } from "@/services/business/business.service"
import { logger } from "@/lib/logger"
import { toast } from "sonner"

// Lazy load heavy map components
const MapView = lazy(() => import("@/components/features/map/map-view").then(m => ({ default: m.MapView })))
const BusinessDrawer = lazy(() => import("@/components/features/map/business-drawer").then(m => ({ default: m.BusinessDrawer })))

export default function ExplorePage() {
    const { currentCity } = useAppStore()
    const { query, filters, sortBy } = useSearchStore()
    const [businesses, setBusinesses] = useState<MapBusiness[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedBusiness, setSelectedBusiness] = useState<MapBusiness | null>(null)

    const [initialCenter, setInitialCenter] = useState<{
        lat: number
        lng: number
    } | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const mapViewRef = useRef<{ centerToLocation: (lat: number, lng: number) => void } | null>(null)

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
        // Prevent body scroll on explore page
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [])

    const handleLocate = useCallback(() => {
        if (!navigator.geolocation) {
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                // We don't force center here immediately on load to respect city center, 
                // but usually user wants to see themselves if they are in the city.
                // The requirement says "lasa locatia utilizatorului afisata constant" (leave user location displayed constantly).
                // We will just update the state so the marker appears.
            },
            () => {
                // Fail silently on auto-locate
            },
            { enableHighAccuracy: true }
        )
    }, [])

    // Trigger location on mount
    useEffect(() => {
        handleLocate()
    }, [handleLocate])

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
                    const data = await getBusinessesForMap(currentCity.id)
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
    }, [currentCity?.id, query, filters, sortBy])


    if (!currentCity) return null

    const isMobile = mounted && window.innerWidth < 768

    return (
        <div className="fixed inset-0 top-0 md:top-[80px] w-full overflow-hidden bg-white z-0">
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
                            cityName={currentCity?.name}
                            showTransit={false}
                            userLocation={userLocation}
                            natureReserves={[]}
                            recreationAreas={[]}
                            onNatureReserveSelect={() => { }}
                            onRecreationAreaSelect={() => { }}
                            showNavigationControls={!isMobile}
                            bottomNavHeight={0}
                        />
                    </Suspense>
                )}
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-slate-200">
                    <Loader2 className="h-3 w-3 animate-spin text-mova-blue" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Se încarcă</span>
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
        </div>
    )
}
