"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getCityFeed, getHomeContext, type CityFeedData, type HomeContext } from "@/services/feed/feed.service"
import { getNearestCity } from "@/services/auth/city.service"
import { useAppStore } from "@/store/app-store"
import { useVacationStore } from "@/store/vacation-store"
import { TravelGuideCard } from "@/components/features/feed/travel-guide-card"
import { TripSummaryCard } from "@/components/features/feed/trip-summary-card"
import { FeedSkeleton } from "@/components/features/feed/feed-skeleton"
import { logger } from "@/lib/logger"
import { useUIStore } from "@/store/ui-store"
import { PlanDashboard } from "@/components/features/trip/plan-dashboard"


export default function HomePage() {
  const router = useRouter()
  const { currentCity, setCity } = useAppStore()
  const { vacations, loadVacations, selectVacation, getActiveVacation } = useVacationStore()
  const { openBusinessDrawer } = useUIStore()
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'home' | 'travel'>('home')

  const [profile, setProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null)
  const [homeContext, setHomeContext] = useState<HomeContext | null>(null)

  // Feed data now depends on viewMode
  const [feedData, setFeedData] = useState<CityFeedData | null>(null)
  const [isFeedLoading, setIsFeedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeVacation = getActiveVacation()

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

        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)
          .single()

        if (profileData) setProfile(profileData)

        // 1. Get basic home context (fallback)
        const context = await getHomeContext(user.id)
        setHomeContext(context)

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

  // React to ViewMode changes
  useEffect(() => {
    async function switchContext() {
      if (!homeContext) return

      setIsFeedLoading(true)
      try {
        if (viewMode === 'home') {
          // Note: In manual implementation we might want to keep the auto-detected city
          // instead of reverting to homeContext.homeCityId strictly on view mode toggle.
          // For now, let's respect currentCity store if set, else fallback.
          const targetCityId = currentCity?.id || homeContext.homeCityId
          if (targetCityId) {
            const feed = await getCityFeed(targetCityId)
            if (feed) setFeedData(feed)
          }

        } else if (viewMode === 'travel' && activeVacation) {
          // Fetch feed for vacation city
          const feed = await getCityFeed(activeVacation.cityId)
          if (feed) setFeedData(feed)
          // Note: setCity() for Travel App Store might update map, etc.
          // We need to fetch full city object if not in store, typically getViewMode handles it?
          // For now relying on store actions or partial update.
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsFeedLoading(false)
      }
    }

    if (!isLoading) {
      switchContext()
    }
  }, [viewMode, homeContext, activeVacation?.cityId, isLoading])

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
    <div className="w-full px-4 sm:px-6 lg:px-12 space-y-12 pb-32 pt-6">
      {/* My Trips - Plan Dashboard Integration */}
      <section className="-mx-4 sm:mx-0">
        <PlanDashboard
          vacations={vacations}
          onSelect={(id) => {
            selectVacation(id)
            router.push('/plan')
          }}
          onCreate={() => {
            // PlanDashboard handles its own dialog state, or we can control it if we want to pass a prop
            // The current PlanDashboard implementation has internal state for dialog, but accepts an onCreate prop.
            // Let's check PlanDashboard again. It calls onCreate() BUT also has internal state?
            // Re-reading PlanDashboard code: 
            // const handleOpenCreate = () => { setIsCreateDialogOpen(true); onCreate() }
            // So it opens its own dialog. We just need to maybe refresh after? 
            // Actually PlanDashboard takes `onCreate` as void.
            // If we want to reload vacations?
          }}
        />
      </section>

      {/* Feed / Activities */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-muted-foreground">
            {viewMode === 'home'
              ? `Activități în ${currentCity?.name || 'Orașul Tău'}`
              : `Activități în ${activeVacation?.cityName || 'Vacanță'}`
            }
          </h2>

          <div className="flex items-center gap-3">
            {/* Vacation Selector (Only in Travel Mode & Multiple Trips) */}
            {viewMode === 'travel' && vacations.length > 1 && (
              <select
                value={activeVacation?.id || ''}
                onChange={(e) => selectVacation(e.target.value)}
                className="h-10 pl-3 pr-8 rounded-xl border border-border bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                style={{ backgroundImage: 'none' }} // Removing default arrow to simple style or use Chevrons if desired, but default is safer for now
              >
                {vacations.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.cityName} ({new Date(v.startDate).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })})
                  </option>
                ))}
              </select>
            )}

            {/* Context Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('home')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'home'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                🏡 Acasă
              </button>
              <button
                onClick={() => setViewMode('travel')}
                disabled={!activeVacation}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'travel'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
              >
                ✈️ În vacanță
                {!activeVacation && <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-normal">No active trip</span>}
              </button>
            </div>
          </div>
        </div>

        {isFeedLoading ? (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 px-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="min-w-[280px] h-[320px] bg-slate-100 rounded-[24px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 px-2 no-scrollbar scroll-smooth -mx-4 sm:mx-0">
            {feedData?.featuredBusinesses && feedData.featuredBusinesses.length > 0 ? (
              feedData.featuredBusinesses.map((biz) => (
                <TravelGuideCard
                  key={biz.id}
                  title={`${biz.name}`} // Simplified title
                  city={viewMode === 'home' ? (currentCity?.name || 'Home') : (activeVacation?.cityName || 'Trip')}
                  spotsCount={7} // Default spots count
                  imageUrl={biz.image_url || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80'}
                  onClick={() => openBusinessDrawer(biz.id)}
                />
              ))
            ) : (
              <div className="w-full text-center py-10 bg-slate-50 rounded-[24px]">
                <p className="text-slate-500">Nu am găsit activități momentan pentru {viewMode === 'home' ? 'orașul tău' : 'această vacanță'}.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
