"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getHomeContext, getCityFeed, type HomeContext, type CityFeedData } from "@/services/feed/feed.service"
import { getUserBusinesses } from "@/actions/business-portal"
import { QuickFilters } from "@/components/features/feed/quick-filters"
import { FeaturedCarousel } from "@/components/features/feed/featured-carousel"
import { NewsCard } from "@/components/features/feed/news-card"
import { FeedSkeleton } from "@/components/features/feed/feed-skeleton"
import { GlobalSearch } from "@/components/features/map/search/global-search"
import { useAppStore } from "@/store/app-store"
import { useSearchStore } from "@/store/search-store"
import { getCityById } from "@/services/auth/city.service"
import { Calendar, MapPin, Sparkles } from "lucide-react"
import { format } from "date-fns"
// Removed server-side ownership service import - using client-side check instead
import { logger } from "@/lib/logger"

export default function HomePage() {
  const router = useRouter()
  const { currentCity, openCitySelector, setCity } = useAppStore()
  const { query, filters, sortBy } = useSearchStore()
  const [isLoading, setIsLoading] = useState(true)
  const [homeContext, setHomeContext] = useState<HomeContext | null>(null)
  const [feedData, setFeedData] = useState<CityFeedData | null>(null)
  const [activeFilter, setActiveFilter] = useState("All")
  const [error, setError] = useState<string | null>(null)
  const [isBusinessOwner, setIsBusinessOwner] = useState(false)

  // Check if user is a business owner
  useEffect(() => {
    async function checkBusinessOwner() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsBusinessOwner(false)
        return
      }

      // Check if user has businesses using client-side query
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1)
      
      setIsBusinessOwner(!error && businesses && businesses.length > 0)
    }

    checkBusinessOwner()
  }, [])

  // Initialize city from user's home city on first load
  useEffect(() => {
    async function initializeCity() {
      // If we already have a city in store, use it (e.g., from onboarding)
      if (currentCity) {
        // Still load context for feed data
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          try {
            const context = await getHomeContext(user.id)
            setHomeContext(context)
          } catch (error) {
            logger.error('Error loading home context', error)
          }
        }
        return
      }

      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Get user's home city from profile
      try {
        const context = await getHomeContext(user.id)
        setHomeContext(context)

        // Only redirect to onboarding if user hasn't completed it
        // Check both homeCityId and role to ensure onboarding is complete
        if (!context.homeCityId || !context.role) {
          logger.log('Home: Onboarding incomplete, redirecting to onboarding')
          router.push('/onboarding')
          return
        }

        // Check if user has businesses - if yes, redirect to business portal
        try {
          const supabaseClient = createClient()
          const { data: businesses, error: businessError } = await supabaseClient
            .from('businesses')
            .select('id')
            .eq('owner_user_id', user.id)
            .limit(1)
          
          if (!businessError && businesses && businesses.length > 0) {
            logger.log('Home: User has businesses, redirecting to business portal', { userId: user.id })
            window.location.href = '/business-portal/dashboard'
            return
          }
        } catch (error) {
          logger.warn('Home: Exception checking businesses', { error, userId: user.id })
        }

        // Onboarding is complete - load user's home city into global store
        if (context.homeCity) {
          setCity(context.homeCity)
        } else if (context.homeCityId) {
          // If we have ID but not full city data, fetch it
          const city = await getCityById(context.homeCityId)
          if (city) {
            setCity(city)
          }
        }
      } catch (error) {
        logger.error('Home: Error loading home context', error)
        // On error, try to get profile directly with better error handling
        const supabase = createClient()
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('home_city_id, role')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          logger.error('Home: Profile fetch error', profileError, { userId: user.id })
          // If it's an RLS error, don't redirect - just show error
          // User might have completed onboarding but RLS is blocking access
          if (profileError.code === 'PGRST116') {
            // Profile truly doesn't exist
            router.push('/onboarding')
          } else {
            // RLS error - log it but don't redirect
            logger.warn('Home: RLS error detected, but not redirecting to onboarding', { code: profileError.code })
            setError('Unable to load profile. Please check RLS policies.')
          }
        } else if (!profile || !profile.home_city_id || !profile.role) {
          // Profile exists but onboarding incomplete
          router.push('/onboarding')
        }
        // If profile exists and onboarding is complete, continue normally
      }
    }

    initializeCity()
  }, [currentCity, router, setCity])

  // Fetch feed data when currentCity, filter, search query, or filters change
  useEffect(() => {
    async function loadFeed() {
      // If no city selected yet, don't fetch
      if (!currentCity) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch feed data for current city
        // Note: Search/filtering will be applied to featured businesses
        const feed = await getCityFeed(currentCity.id, activeFilter)
        setFeedData(feed)
      } catch (err) {
        logger.error('Error loading feed', err)
        setError('Failed to load feed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadFeed()
  }, [currentCity?.id, activeFilter, query, filters, sortBy])

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bună dimineața"
    if (hour < 18) return "Bună ziua"
    return "Bună seara"
  }

  // Get current date formatted
  const currentDate = format(new Date(), "EEEE, d MMM")

  // Show city selector prompt if no city selected
  if (!currentCity) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25">
            <MapPin className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Alege Destinația</h3>
          <p className="text-slate-600 mb-6">
            Selectează un oraș pentru a descoperi locuri uimitoare, evenimente și experiențe locale
          </p>
          <button
            onClick={openCitySelector}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Selectează Oraș
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <FeedSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md w-full">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Ceva nu a mers bine</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    )
  }

  if (!feedData) {
    return null
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      {/* Global Search Bar */}
      <div className="mt-4">
        <GlobalSearch variant="static" />
      </div>

      {/* Header Context */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          <span>{currentDate}</span>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-mova-dark">
            {currentCity.name}
          </h1>
          <div className="flex items-center gap-2 text-mova-gray mt-2">
            <MapPin className="h-4 w-4" />
            <span className="text-base">
              {currentCity.state_province
                ? `${currentCity.state_province}, ${currentCity.country}`
                : currentCity.country}
            </span>
          </div>
        </div>
      </div>


      {/* Quick Filters */}
      <div>
        <QuickFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Featured Section - "Don't Miss" */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-mova-dark">Nu rata</h2>
          {feedData.featuredBusinesses.length > 0 && (
            <button className="text-mova-blue text-sm font-semibold hover:underline transition-colors">
              Vezi toate
            </button>
          )}
        </div>

        {feedData.featuredBusinesses.length > 0 ? (
          <FeaturedCarousel businesses={feedData.featuredBusinesses} />
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Încă nu există locuri recomandate
            </h3>
            <p className="text-slate-600 text-sm">
              Revino curând pentru recomandări noi
            </p>
          </div>
        )}
      </section>

      {/* News/Events Section - "Happening Nearby" */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-mova-dark">Se întâmplă în apropiere</h2>
          {feedData.cityPosts.length > 0 && (
            <button className="text-mova-blue text-sm font-semibold hover:underline transition-colors">
              Vezi toate
            </button>
          )}
        </div>

        {feedData.cityPosts.length > 0 ? (
          <div className="space-y-3">
            {feedData.cityPosts.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="airbnb-card p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-mova-light-gray flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-mova-gray" />
            </div>
            <h3 className="font-semibold text-mova-dark mb-2 text-lg">
              Încă nu există știri sau evenimente
            </h3>
            <p className="text-mova-gray text-sm">
              Fii primul care împărtășește ceva ce se întâmplă în orașul tău
            </p>
            {/* Only show Create Post button for business owners */}
            {isBusinessOwner && (
            <button className="mt-4 airbnb-button">
              Creează postare
            </button>
            )}
          </div>
        )}
      </section>

      {/* Promotions Section (if available) */}
      {feedData.promotions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-mova-dark">Oferte speciale</h2>
            <button className="text-mova-blue text-sm font-semibold hover:underline transition-colors">
              Vezi toate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedData.promotions.slice(0, 4).map((promotion) => (
              <div
                key={promotion.id}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
                    {promotion.discount_percentage}% OFF
                  </span>
                  <span className="text-xs text-slate-600">
                    Valabil până pe {format(new Date(promotion.valid_until), "d MMM")}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{promotion.title}</h3>
                {promotion.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {promotion.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
