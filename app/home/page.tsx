"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getCityFeed, getHomeContext, type CityFeedData, type HomeContext } from "@/services/feed/feed.service"
import { getNearestCity } from "@/services/auth/city.service"
import { useAppStore } from "@/store/app-store"
import { useVacationStore } from "@/store/vacation-store"
import { TravelGuideCard } from "@/components/features/feed/travel-guide-card"
import { FeedSkeleton } from "@/components/features/feed/feed-skeleton"
import { logger } from "@/lib/logger"
import { useUIStore } from "@/store/ui-store"
import { PlanDashboard } from "@/components/features/trip/plan-dashboard"


export default function HomePage() {
  const router = useRouter()
  const { currentCity, setCity } = useAppStore()
  const { vacations, loadVacations, selectVacation } = useVacationStore()
  const { openBusinessDrawer } = useUIStore()
  const [isLoading, setIsLoading] = useState(true)

  const [feedData, setFeedData] = useState<CityFeedData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [locationError, setLocationError] = useState<string | null>(null)

  // Initial Load & Location Check
  useEffect(() => {
    async function initialize() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // 1. Get basic home context (fallback)
        const context = await getHomeContext(user.id)

        // CRITICAL: Reset vacation store before loading to prevent cross-user data leak
        useVacationStore.getState().reset()

        // 2. Refresh active vacation
        await loadVacations()

        // 3. Determine initial city (Location based > Home City)
        let determinedCityId = context.homeCityId
        let determinedCity = context.homeCity

        // Attempt location detection
        if ("geolocation" in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 60000 // Cache for 1 min
              })
            })

            const nearestCity = await getNearestCity(position.coords.latitude, position.coords.longitude)
            if (nearestCity) {
              determinedCity = nearestCity
              determinedCityId = nearestCity.id
              console.log("📍 Auto-detected city:", nearestCity.name)
            } else {
              console.log("📍 No supported city found nearby")
            }
          } catch (locError) {
            console.warn("Location permission denied or error:", locError)
            setLocationError("Nu am putut detecta locația ta. Se afișează orașul de reședință.")
          }
        }

        // Set the city
        if (determinedCity) {
          setCity(determinedCity)
        }

        // 4. Load feed for the determined city
        if (determinedCityId) {
          const feed = await getCityFeed(determinedCityId)
          if (feed) setFeedData(feed)
        }

      } catch (err) {
        logger.error('Error initializing home page', err)
        setError('A apărut o eroare la încărcarea datelor.')
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [router, setCity, loadVacations])

  if (isLoading) return <FeedSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-xl">
          Reîncearcă
        </button>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 space-y-6 pb-32">
      {/* My Trips - Plan Dashboard Integration */}
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

      {/* Feed / Activities - Always shows current city */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-muted-foreground">
            Activități în {currentCity?.name || 'Orașul Tău'}
          </h2>
        </div>

        {/* Grid Layout - 1 per row on mobile, 4 per row on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {feedData?.featuredBusinesses && feedData.featuredBusinesses.length > 0 ? (
            feedData.featuredBusinesses.map((biz, index) => (
              <TravelGuideCard
                key={biz.id}
                title={biz.name}
                city={currentCity?.name || 'Home'}
                spotsCount={7}
                imageUrl={biz.image_url || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80'}
                onClick={() => openBusinessDrawer(biz.id)}
                fullWidth // Full width on mobile, grid handles desktop sizing
              />
            ))
          ) : (
            <div className="col-span-full w-full text-center py-10 bg-slate-50 rounded-[24px]">
              <p className="text-slate-500">Nu am găsit activități momentan pentru orașul tău.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
