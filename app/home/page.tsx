"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getCityFeed, getHomeContext, type CityFeedData, type HomeContext } from "@/services/feed/feed.service"
import { useAppStore } from "@/store/app-store"
import { useVacationStore } from "@/store/vacation-store"
import { TravelGuideCard } from "@/components/features/feed/travel-guide-card"
import { TripSummaryCard } from "@/components/features/feed/trip-summary-card"
import { FeedSkeleton } from "@/components/features/feed/feed-skeleton"
import { logger } from "@/lib/logger"
import { useUIStore } from "@/store/ui-store"

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

  // Initial Load
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

        const context = await getHomeContext(user.id)
        setHomeContext(context)

        // Only redirect to onboarding if no home_city_id set
        // home_city_id is the indicator that onboarding was completed
        if (!context.homeCityId) {
          router.push('/onboarding')
          return
        }

        // Set default city to home context
        if (context.homeCity) {
          setCity(context.homeCity)
        }

        // CRITICAL: Reset vacation store before loading to prevent cross-user data leak
        useVacationStore.getState().reset()

        // Load vacations and feed data
        const [_, feed] = await Promise.all([
          loadVacations(),
          context.homeCityId ? getCityFeed(context.homeCityId!) : Promise.resolve(null)
        ]);
        if (feed) setFeedData(feed)

        // If there is an active vacation starting today/soon, maybe prompt to switch?
        // For now, logic defaults to 'home'.

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
        if (viewMode === 'home' && homeContext.homeCityId) {
          const feed = await getCityFeed(homeContext.homeCityId)
          if (feed) setFeedData(feed)
          if (homeContext.homeCity) setCity(homeContext.homeCity)
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
      {/* My Trips */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-muted-foreground">Călătoriile mele</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacations.length > 0 ? (
            vacations.map((vacation) => (
              <TripSummaryCard
                key={vacation.id}
                title={vacation.title}
                cityName={vacation.cityName}
                startDate={vacation.startDate}
                endDate={vacation.endDate}
                spotsCount={vacation.spotsCount}
                imageUrl={vacation.coverImage}
                onClick={() => {
                  selectVacation(vacation.id)
                  router.push('/plan')
                }}
                className="bg-white/95 backdrop-blur-md border border-white/20 shadow-sm hover:bg-white transition-colors [&_h3]:text-slate-900 [&_p]:text-slate-600"
              />
            ))
          ) : (
            <div
              onClick={() => router.push('/plan')}
              className="col-span-full p-16 border-2 border-dashed border-border rounded-[32px] text-center cursor-pointer hover:bg-secondary/20 transition-colors"
            >
              <p className="text-muted-foreground font-medium">Nu ai nicio călătorie planificată.</p>
              <p className="text-primary font-bold mt-2">Începe una nouă acum!</p>
            </div>
          )}
        </div>
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
