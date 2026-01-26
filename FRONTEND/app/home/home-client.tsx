"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getCityFeed, type CityFeedData, type HomeContext } from "@/services/feed/feed.service"
import { getNearestCity, getCities } from "@/services/auth/city.service"
import { useAppStore } from "@/store/app-store"
import { useVacationStore } from "@/store/vacation-store"
import { TravelGuideCard } from "@/components/features/feed/travel-guide-card"
import { useUIStore } from "@/store/ui-store"
import { PlanDashboard } from "@/components/features/trip/plan-dashboard"
import { Button } from "@/components/shared/ui/button"
import { MapPin, RefreshCw } from "lucide-react"

interface HomeClientProps {
    initialContext: HomeContext
    initialFeed: CityFeedData | null
}

export function HomeClient({ initialContext, initialFeed }: HomeClientProps) {
    const router = useRouter()
    const { currentCity, setCity, openCitySelector } = useAppStore()
    const { vacations, loadVacations, selectVacation } = useVacationStore()
    const { openBusinessDrawer } = useUIStore()

    const [feedData, setFeedData] = useState<CityFeedData | null>(initialFeed)
    const [isLoadingFeed, setIsLoadingFeed] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Ensure we only render after hydration to avoid mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const loadFeed = useCallback(async (cityId: string) => {
        setIsLoadingFeed(true)
        try {
            const feed = await getCityFeed(cityId)
            if (feed) {
                setFeedData(feed)
            }
        } catch (e) {
            console.error("Failed to load feed", e)
        } finally {
            setIsLoadingFeed(false)
        }
    }, [])

    // 1. Initialization Logic
    useEffect(() => {
        if (!mounted) return

        // If no city in store, use server city
        if (!currentCity && initialContext.homeCity) {
            setCity(initialContext.homeCity)
        }

        loadVacations()
    }, [mounted])

    // 2. Feed sync Logic
    useEffect(() => {
        if (!mounted || !currentCity?.id) return

        // Always try to refresh feed on city change OR if initial page load settled
        loadFeed(currentCity.id)
    }, [currentCity?.id, mounted])

    // 3. One-time Location Detection (on refresh)
    useEffect(() => {
        if (!mounted) return

        async function detect() {
            if ("geolocation" in navigator) {
                try {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            const nearest = await getNearestCity(pos.coords.latitude, pos.coords.longitude)
                            if (nearest && nearest.id !== currentCity?.id) {
                                setCity(nearest)
                            }
                        },
                        (error) => {
                            // Silently handle geolocation errors (user denied, unavailable, etc.)
                            // Fallback to server-provided city or default
                            console.debug('Geolocation not available:', error.message)
                        },
                        {
                            timeout: 5000,
                            maximumAge: 300000, // Cache for 5 minutes
                        }
                    )
                } catch (error) {
                    // Handle permission policy violations gracefully
                    console.debug('Geolocation access blocked:', error)
                }
            }
        }
        detect()
    }, [mounted, currentCity?.id, setCity])

    const handleSwitchToBrasov = async () => {
        const all = await getCities()
        const b = all.find(c => c.name === 'Brașov')
        if (b) setCity(b)
    }

    if (!mounted) {
        return <div className="min-h-screen bg-white" />
    }

    const cityName = currentCity?.name || initialContext.homeCity?.name || 'Orașul Tău'

    return (
        <div className="w-full px-4 sm:px-6 lg:px-12 space-y-8 pb-32">
            <section className="-mx-4 sm:mx-0">
                <PlanDashboard
                    vacations={vacations}
                    onSelect={(id) => {
                        selectVacation(id)
                        router.push('/plan')
                    }}
                    onCreate={() => { }}
                />
            </section>

            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-muted-foreground flex items-center gap-3">
                        Activități în {cityName}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCitySelector()}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <MapPin className="h-5 w-5" />
                        </Button>
                    </h2>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => currentCity && loadFeed(currentCity.id)}
                        disabled={isLoadingFeed}
                        className="text-slate-400"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFeed ? 'animate-spin' : ''}`} />
                        Actualizează
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {feedData?.featuredBusinesses && feedData.featuredBusinesses.length > 0 ? (
                        feedData.featuredBusinesses.map((biz, index) => (
                            <TravelGuideCard
                                key={`${biz.id}-${currentCity?.id}`}
                                title={biz.name}
                                city={cityName}
                                spotsCount={7}
                                imageUrl={biz.image_url || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80'}
                                onClick={() => openBusinessDrawer(biz.id)}
                                fullWidth
                                priority={index === 0}
                            />
                        ))
                    ) : (
                        <div className="col-span-full w-full text-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] space-y-6">
                            <div className="space-y-2">
                                <p className="text-slate-500 font-semibold text-lg">
                                    {isLoadingFeed ? 'Se caută activități...' : `E liniște în ${cityName} momentan.`}
                                </p>
                                <p className="text-slate-400 text-sm max-w-md mx-auto">
                                    Nu am găsit activități listate. Încearcă să schimbi orașul sau să revii mai târziu.
                                </p>
                            </div>

                            {!isLoadingFeed && (
                                <div className="flex flex-col items-center gap-4 pt-4">
                                    <Button onClick={handleSwitchToBrasov} variant="default" className="rounded-full px-8">
                                        Vezi activități în Brașov
                                    </Button>
                                    <Button onClick={() => openCitySelector()} variant="link" className="text-slate-400 text-xs">
                                        Alege manual alt oraș
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
