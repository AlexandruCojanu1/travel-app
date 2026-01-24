"use client"

import { useEffect, useState, Suspense, lazy, useCallback } from "react"
import { Loader2, MapPin, PartyPopper } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useVacationStore } from "@/store/vacation-store"
import { useTripStore } from "@/store/trip-store"
import { getBusinessesForMap, getEventsForMap, getUserSwipedIds, type MapBusiness } from "@/services/business/business.service"
import { logger } from "@/lib/logger"
import { SwipeStack } from "@/components/features/explore/swipe-stack"
import { CategoryProgress, type SwipeCategory } from "@/components/features/explore/category-progress"
import { Button } from "@/components/shared/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUIStore } from "@/store/ui-store"
import { BusinessDetailsDrawer } from "@/components/features/business/public/business-details-drawer"

import { HotelBookingDrawer } from '@/components/features/explore/hotel-booking-drawer'

// Category filter mapping
const CATEGORY_FILTERS: Record<SwipeCategory, string[]> = {
    hotel: ['Hotel', 'Hotels', 'Lodging', 'Accommodation', 'Guesthouse', 'Apartment', 'Hostel', 'Bed and Breakfast', 'Resort', 'Villa', 'Motel'],
    restaurants: ['Restaurant', 'Cafe', 'Bar', 'Food', 'Cafes', 'Bars'],
    activities: ['Activities', 'Attraction', 'Museum', 'Nature', 'Shopping', 'Spa'],
}

function ExploreContent() {
    const router = useRouter()
    const { currentCity } = useAppStore()
    const { vacations, loadVacations, getActiveVacation, selectVacation } = useVacationStore()
    const { tripDetails } = useTripStore()

    // Multi-category state
    const [currentCategory, setCurrentCategory] = useState<SwipeCategory>('hotel')
    const [completedCategories, setCompletedCategories] = useState<SwipeCategory[]>([])
    const [selectedHotel, setSelectedHotel] = useState<MapBusiness | null>(null)
    const [likedBusinesses, setLikedBusinesses] = useState<Record<SwipeCategory, MapBusiness[]>>({
        hotel: [],
        restaurants: [],
        activities: [],
    })

    // All businesses by category
    const [allBusinesses, setAllBusinesses] = useState<Record<SwipeCategory, MapBusiness[]>>({
        hotel: [],
        restaurants: [],
        activities: [],
    })
    const [currentBusinesses, setCurrentBusinesses] = useState<MapBusiness[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { openBusinessDrawer } = useUIStore()
    const [showSummary, setShowSummary] = useState(false)
    const searchParams = useSearchParams()

    // Deep linking state
    const [deepLinkBusiness, setDeepLinkBusiness] = useState<MapBusiness | null>(null)
    const [showBookingDrawer, setShowBookingDrawer] = useState(false)

    // Auto-select first vacation if none is active
    useEffect(() => {
        const activeVacation = getActiveVacation()
        if (!activeVacation && vacations.length > 0) {
            selectVacation(vacations[0].id)
        }
    }, [vacations, getActiveVacation, selectVacation])

    // Load vacations on mount
    useEffect(() => {
        loadVacations()
    }, [loadVacations])

    // Fetch ALL businesses and categorize them
    useEffect(() => {
        async function loadBusinesses() {
            if (!currentCity) return

            setIsLoading(true)
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                // Fetch businesses, events and user swipes in parallel
                const [businessResults, eventResults, swipedIds] = await Promise.all([
                    getBusinessesForMap(currentCity.id),
                    getEventsForMap(currentCity.id),
                    user ? getUserSwipedIds(user.id, 'pass') : Promise.resolve([])
                ])

                const results = [...businessResults, ...eventResults]

                // Categorize businesses
                const categorized: Record<SwipeCategory, MapBusiness[]> = {
                    hotel: [],
                    restaurants: [],
                    activities: [],
                }

                // Filter out invalid businesses AND swiped businesses AND already added businesses
                const vacation = getActiveVacation() as any
                const addedIds = vacation?.items?.map((item: any) => item.business_id || item.id) || []

                const validResults = results.filter(b => b.id && !swipedIds.includes(b.id) && !addedIds.includes(b.id))

                validResults.forEach(business => {
                    const category = business.category

                    // Helper to check if a business is lodging/accommodation
                    const isLodgingHelper = (b: MapBusiness) => {
                        const terms = ['hotel', 'lodging', 'accommodation', 'hostel', 'resort', 'villa', 'apartment', 'bnb', 'bed and breakfast', 'pension', 'cazare', 'rooms', 'suites', 'inn', 'motel', 'guesthouse']
                        const lowerCat = b.category.toLowerCase()
                        const lowerName = b.name.toLowerCase()

                        return terms.some(term => lowerCat.includes(term) || lowerName.includes(term))
                    }

                    if (CATEGORY_FILTERS.hotel.some(c => c.toLowerCase() === category.toLowerCase())) {
                        categorized.hotel.push(business)
                    } else if (CATEGORY_FILTERS.restaurants.some(c => c.toLowerCase() === category.toLowerCase())) {
                        categorized.restaurants.push(business)
                    } else if (CATEGORY_FILTERS.activities.some(c => c.toLowerCase() === category.toLowerCase())) {
                        if (!isLodgingHelper(business)) {
                            categorized.activities.push(business)
                        }
                    } else {
                        // Default to activities for unknown categories, BUT exclude anything that sounds like lodging


                        if (!isLodgingHelper(business)) {
                            categorized.activities.push(business)
                        }
                    }
                })

                // Shuffle each category
                Object.keys(categorized).forEach(key => {
                    categorized[key as SwipeCategory] = categorized[key as SwipeCategory].sort(() => Math.random() - 0.5)
                })

                setAllBusinesses(categorized)
                setCurrentBusinesses(categorized.hotel)

                // Handle Deep Link
                if (searchParams) {
                    const businessId = searchParams.get('business_id')
                    const action = searchParams.get('action')

                    if (businessId && action === 'book') {
                        // Find business in fetched results
                        const targetBusiness = results.find(b => b.id === businessId)
                        if (targetBusiness) {
                            setDeepLinkBusiness(targetBusiness)
                            setShowBookingDrawer(true)
                        }
                    }
                }

            } catch (error) {
                logger.error("Error loading businesses", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadBusinesses()
    }, [currentCity?.id, searchParams]) // Add searchParams dependency

    // Update current businesses when category changes
    useEffect(() => {
        setCurrentBusinesses(allBusinesses[currentCategory])
    }, [currentCategory, allBusinesses])

    // Handle swipe right (like)
    const handleLike = useCallback((business: MapBusiness) => {
        if (currentCategory === 'hotel') {
            // For hotels, select only one and move to next category
            setSelectedHotel(business)
            setLikedBusinesses(prev => ({ ...prev, hotel: [business] }))
            setCompletedCategories(prev => [...prev, 'hotel'])
            setCurrentCategory('restaurants')
        } else {
            // For other categories, collect multiple
            setLikedBusinesses(prev => ({
                ...prev,
                [currentCategory]: [...prev[currentCategory], business]
            }))
        }
    }, [currentCategory])

    // Handle when all cards in a category are swiped
    const handleStackEmpty = useCallback(() => {
        if (currentCategory === 'hotel') {
            // Even if no hotel selected, allow moving to restaurants
            setCompletedCategories(prev => [...prev, 'hotel'])
            setCurrentCategory('restaurants')
            return
        }

        if (currentCategory === 'restaurants') {
            setCompletedCategories(prev => [...prev, 'restaurants'])
            setCurrentCategory('activities')
        } else if (currentCategory === 'activities') {
            setCompletedCategories(prev => [...prev, 'activities'])
            setShowSummary(true)
        }
    }, [currentCategory, selectedHotel])

    // Skip current category
    const handleSkipCategory = useCallback(() => {
        if (currentCategory === 'hotel') {
            setCompletedCategories(prev => [...prev, 'hotel'])
            setCurrentCategory('restaurants')
        } else if (currentCategory === 'restaurants') {
            setCompletedCategories(prev => [...prev, 'restaurants'])
            setCurrentCategory('activities')
        } else if (currentCategory === 'activities') {
            setCompletedCategories(prev => [...prev, 'activities'])
            setShowSummary(true)
        }
    }, [currentCategory])

    if (!currentCity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <MapPin className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                    Selectează un oraș
                </h2>
                <p className="text-gray-500 text-center">
                    Mergi la pagina Home și selectează un oraș pentru a descoperi locuri
                </p>
            </div>
        )
    }

    // Summary screen after all categories
    if (showSummary) {
        const totalLiked = likedBusinesses.hotel.length + likedBusinesses.restaurants.length + likedBusinesses.activities.length

        return (
            <div className="fixed inset-0 top-0 md:top-[72px] bg-gradient-to-b from-purple-50 to-white overflow-auto">
                <div className="max-w-md mx-auto px-6 py-12">
                    {/* Celebration Icon */}
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                            <PartyPopper className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Gata!</h1>
                        <p className="text-gray-500">Ai selectat {totalLiked} locuri pentru vacanța ta</p>
                    </div>

                    {/* Selected Hotel */}
                    {selectedHotel && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <span>🏨</span> Cazare
                            </div>
                            <h3 className="font-bold text-gray-900">{selectedHotel.name}</h3>
                            <p className="text-sm text-gray-500">{selectedHotel.address}</p>
                        </div>
                    )}

                    {/* Restaurants */}
                    {likedBusinesses.restaurants.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <span>🍽️</span> Restaurante ({likedBusinesses.restaurants.length})
                            </div>
                            <div className="space-y-2">
                                {likedBusinesses.restaurants.slice(0, 3).map(r => (
                                    <p key={r.id} className="font-medium text-gray-900 text-sm">{r.name}</p>
                                ))}
                                {likedBusinesses.restaurants.length > 3 && (
                                    <p className="text-sm text-gray-400">+{likedBusinesses.restaurants.length - 3} altele</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activities */}
                    {likedBusinesses.activities.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <span>🎯</span> Activități ({likedBusinesses.activities.length})
                            </div>
                            <div className="space-y-2">
                                {likedBusinesses.activities.slice(0, 3).map(a => (
                                    <p key={a.id} className="font-medium text-gray-900 text-sm">{a.name}</p>
                                ))}
                                {likedBusinesses.activities.length > 3 && (
                                    <p className="text-sm text-gray-400">+{likedBusinesses.activities.length - 3} altele</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3 mt-8">
                        <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6"
                            onClick={() => router.push('/plan')}
                        >
                            Planifică Vacanța
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full py-6"
                            onClick={() => {
                                setShowSummary(false)
                                setCurrentCategory('hotel')
                                setCompletedCategories([])
                                setSelectedHotel(null)
                                setLikedBusinesses({ hotel: [], restaurants: [], activities: [] })
                            }}
                        >
                            Începe din nou
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 top-0 md:top-[72px] bg-neutral-900 overflow-hidden flex flex-col">
            {/* Header with Progress */}
            <div className="pt-6 px-6 pb-2 bg-neutral-900 z-20 shrink-0">
                <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-neutral-400 text-xs tracking-[0.2em] uppercase mb-1">DESTINAȚIA TA</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight">
                        {currentCity?.name ? currentCity.name.toUpperCase() : 'EXPLORE'}
                    </h1>
                </div>

                {/* Skip button for ALL categories */}
                {currentBusinesses.length > 0 && (
                    <button
                        onClick={handleSkipCategory}
                        className="text-[10px] text-neutral-600 hover:text-white transition-colors mt-2 mx-auto block uppercase tracking-wider"
                    >
                        {currentCategory === 'hotel'
                            ? 'SKIP HOTELS'
                            : currentCategory === 'restaurants'
                                ? 'SKIP RESTAURANTS'
                                : 'SKIP ACTIVITIES'}
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" />
                            <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-white animate-spin" />
                        </div>
                        <p className="mt-6 text-gray-600 font-medium">Se încarcă locurile...</p>
                    </div>
                ) : currentBusinesses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-8">
                        <div className="text-6xl mb-4">
                            {currentCategory === 'hotel' ? '🏨' : currentCategory === 'restaurants' ? '🍽️' : '🎯'}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                            Nu sunt {currentCategory === 'hotel' ? 'hoteluri' : currentCategory === 'restaurants' ? 'restaurante' : 'activități'} disponibile
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            În acest oraș nu sunt încă înregistrate locuri din această categorie.
                        </p>
                        {/* Show continue button for ALL categories if empty */}
                        <Button onClick={handleSkipCategory}>
                            Continuă la următoarea categorie
                        </Button>
                    </div>
                ) : (
                    <SwipeStack
                        businesses={currentBusinesses}
                        onBusinessSelect={(business) => openBusinessDrawer(business.id)}
                        onLike={handleLike}
                        onStackEmpty={handleStackEmpty}
                        cityName={currentCity.name}
                    />
                )}
            </div>

            {/* Business Details Drawer */}
            <Suspense fallback={null}>
                <BusinessDetailsDrawer />
            </Suspense>
            {/* Deep Link Booking Drawer */}
            {deepLinkBusiness && (
                <HotelBookingDrawer
                    business={deepLinkBusiness}
                    isOpen={showBookingDrawer}
                    onClose={() => {
                        setShowBookingDrawer(false)
                        // Clear search params
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, '', newUrl);
                    }}
                />
            )}

        </div>
    )
}

export default function ExplorePage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 text-mova-blue animate-spin" />
            </div>
        }>
            <ExploreContent />
        </Suspense>
    )
}
