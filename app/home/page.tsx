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
  const { vacations, loadVacations, selectVacation } = useVacationStore()
  const { openBusinessDrawer } = useUIStore()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null)
  const [homeContext, setHomeContext] = useState<HomeContext | null>(null)
  const [feedData, setFeedData] = useState<CityFeedData | null>(null)
  const [error, setError] = useState<string | null>(null)

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

        if (!context.homeCityId || !context.role) {
          router.push('/onboarding')
          return
        }

        if (context.homeCity) {
          setCity(context.homeCity)
        }

        // Load vacations and feed data
        const [_, feed] = await Promise.all([
          loadVacations(),
          context.homeCityId ? getCityFeed(context.homeCityId) : Promise.resolve(null)
        ])

        if (feed) setFeedData(feed)

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
    <div className="w-full px-4 sm:px-6 lg:px-12 space-y-12 pb-32 pt-6">
      {/* My Trips */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#A4A4A4]">Călătoriile mele</h2>
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
              />
            ))
          ) : (
            <div
              onClick={() => router.push('/plan')}
              className="col-span-full p-16 border-2 border-dashed border-slate-200 rounded-[32px] text-center cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <p className="text-slate-400 font-medium">Nu ai nicio călătorie planificată.</p>
              <p className="text-primary font-bold mt-2">Începe una nouă acum!</p>
            </div>
          )}
        </div>
      </section>

      {/* Feed / Activities */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#A4A4A4]">
          Activități din {currentCity?.name || 'orașul tău'}
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-6 px-2 no-scrollbar scroll-smooth -mx-4 sm:mx-0">
          {feedData?.featuredBusinesses && feedData.featuredBusinesses.length > 0 ? (
            feedData.featuredBusinesses.map((biz) => (
              <TravelGuideCard
                key={biz.id}
                title={`1-Day ${biz.name} Trip`}
                city={currentCity?.name || 'România'}
                spotsCount={7}
                imageUrl={biz.image_url || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80'}
                onClick={() => openBusinessDrawer(biz.id)}
              />
            ))
          ) : (
            // Fallback guides
            [1, 2, 3, 4, 5].map((i) => (
              <TravelGuideCard
                key={i}
                priority={i <= 2}
                title={i === 1 ? "1-Day Paris Trip" : i === 2 ? "1-Day Rome Trip" : i === 3 ? "3-Day London Trip" : i === 4 ? "Tokyo Explore" : "NYC City Tour"}
                city={i === 1 ? "Paris" : i === 2 ? "Rome" : i === 3 ? "London" : i === 4 ? "Tokyo" : "New York"}
                spotsCount={i * 5}
                imageUrl={
                  i === 1
                    ? "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80"
                    : i === 2
                      ? "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80"
                      : i === 3
                        ? "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&q=80"
                        : i === 4
                          ? "https://images.unsplash.com/photo-1540959733332-e94e270b4d4a?w=500&q=80"
                          : "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=500&q=80"
                }
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
