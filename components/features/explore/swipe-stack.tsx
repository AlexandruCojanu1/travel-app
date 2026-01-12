"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { recordSwipe } from "@/services/business/business.service"
import { Heart, X, RotateCcw, Info, Sparkles, MapPin } from "lucide-react"
import { BusinessSwipeCard } from "./business-swipe-card"
import type { MapBusiness } from "@/services/business/business.service"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { saveBusinessForUser } from "@/services/auth/profile.service"
import { addBusinessToTrip } from "@/services/trip/trip.service"
import { useVacationStore } from "@/store/vacation-store"
import { useUIStore } from "@/store/ui-store"
import { createClient } from "@/lib/supabase/client"

interface SwipeStackProps {
    businesses: MapBusiness[]
    onBusinessSelect: (business: MapBusiness) => void
    cityName?: string
    onLike?: (business: MapBusiness) => void
    onStackEmpty?: () => void
    guests?: number
}

export function SwipeStack({
    businesses,
    onBusinessSelect,
    cityName,
    onLike,
    onStackEmpty,
    guests = 2
}: SwipeStackProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [likedBusinesses, setLikedBusinesses] = useState<MapBusiness[]>([])
    const [passedBusinesses, setPassedBusinesses] = useState<MapBusiness[]>([])
    const [history, setHistory] = useState<{ business: MapBusiness; action: 'like' | 'pass' }[]>([])
    const [isFinished, setIsFinished] = useState(false)

    // Reset state when businesses array changes (category switch)
    useEffect(() => {
        setCurrentIndex(0)
        setIsFinished(false)
        setHistory([])
        setLikedBusinesses([])
        setPassedBusinesses([])
    }, [businesses])

    // Check if stack is empty
    useEffect(() => {
        if (currentIndex >= businesses.length && businesses.length > 0 && !isFinished) {
            setIsFinished(true)
            if (onStackEmpty) {
                onStackEmpty()
            }
        }
    }, [currentIndex, businesses.length, isFinished, onStackEmpty])

    // Get active vacation to add businesses to trip
    const getActiveVacation = useVacationStore(state => state.getActiveVacation)
    const activeVacation = getActiveVacation()

    // Get function to open business details popup
    const openBusinessDrawer = useUIStore(state => state.openBusinessDrawer)

    const currentBusiness = businesses[currentIndex]
    const nextBusiness = businesses[currentIndex + 1]

    // Debug check
    if (currentBusiness && !currentBusiness.id) console.error("currentBusiness has no ID:", currentBusiness)
    if (nextBusiness && !nextBusiness.id) console.error("nextBusiness has no ID:", nextBusiness)




    const handleSwipeLeft = useCallback(async () => {
        if (currentIndex >= businesses.length) return

        const business = businesses[currentIndex]
        setPassedBusinesses(prev => [...prev, business])
        setHistory(prev => [...prev, { business, action: 'pass' }])
        setCurrentIndex(prev => prev + 1)

        // Persist pass
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user && business.id) {
            recordSwipe(user.id, business.id, 'pass').catch(console.error)
        }
    }, [currentIndex, businesses])

    const handleSwipeRight = useCallback(async () => {
        if (currentIndex >= businesses.length) return

        const business = businesses[currentIndex]
        setLikedBusinesses(prev => [...prev, business])
        setHistory(prev => [...prev, { business, action: 'like' }])
        setCurrentIndex(prev => prev + 1)

        // Notify parent
        if (onLike) {
            onLike(business)
        }

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Record swipe persistence
                if (business.id) {
                    recordSwipe(user.id, business.id, 'like').catch(console.error)
                }

                // Save to favorites (may fail silently due to RLS)
                saveBusinessForUser(user.id, business.id).catch(console.error)

                // Add to active trip if exists
                if (activeVacation?.id) {
                    addBusinessToTrip(activeVacation.id, business.id, 0, 'morning')
                        .then(result => {
                            if (result.success) {
                                toast.success(`${business.name} adăugat în plan!`, {
                                    duration: 2000
                                })
                            }
                        })
                        .catch(console.error)
                } else {
                    toast.success("Salvat la favorite!", {
                        duration: 1500
                    })
                }
            }
        } catch (error) {
            console.error('[SwipeStack] Error saving swipe:', error)
        }
    }, [currentIndex, businesses, activeVacation, onLike])

    const handleRewind = useCallback(() => {
        if (history.length === 0) return

        const lastAction = history[history.length - 1]
        setHistory(prev => prev.slice(0, -1))
        setCurrentIndex(prev => prev - 1)
        setIsFinished(false)

        if (lastAction.action === 'like') {
            setLikedBusinesses(prev => prev.slice(0, -1))
        } else {
            setPassedBusinesses(prev => prev.slice(0, -1))
        }
        toast.info("Undo! 🔄")
    }, [history])

    const handleTap = useCallback(() => {
        if (currentBusiness) {
            onBusinessSelect(currentBusiness)
        }
    }, [currentBusiness, onBusinessSelect])

    if (businesses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nu există locații</h3>
                <p className="text-slate-500">Nu am găsit locații în acest oraș încă.</p>
            </div>
        )
    }

    if (currentIndex >= businesses.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-green-500 fill-green-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Ai văzut tot!</h3>
                <p className="text-slate-500 max-w-xs">
                    Ai parcurs toate locațiile disponibile. Revino mai târziu pentru noutăți!
                </p>
                <button
                    onClick={() => {
                        setCurrentIndex(0)
                        setHistory([])
                        setLikedBusinesses([])
                        setPassedBusinesses([])
                        setIsFinished(false)
                    }}
                    className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors"
                >
                    Ia-o de la capăt
                </button>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-between py-4 pb-24 md:pb-8 max-w-md mx-auto">
            {/* Cards Container */}
            <div className="relative w-full aspect-[3/4] md:aspect-[4/5] h-full max-h-[65vh] md:max-h-[600px] z-10 px-4">
                <AnimatePresence>
                    {nextBusiness && nextBusiness.id && (
                        <div
                            key={`${nextBusiness.id}-next`}
                            className="absolute inset-0 px-4 scale-95 opacity-50 translate-y-4"
                        >
                            <BusinessSwipeCard
                                business={nextBusiness}
                                onSwipeLeft={() => { }}
                                onSwipeRight={() => { }}
                                onTap={() => { }}
                                isTop={false}
                            />
                        </div>
                    )}

                    {currentBusiness && currentBusiness.id && (
                        <div
                            key={currentBusiness.id}
                            className="absolute inset-0 px-4"
                        >
                            <BusinessSwipeCard
                                business={currentBusiness}
                                onSwipeLeft={handleSwipeLeft}
                                onSwipeRight={handleSwipeRight}
                                onTap={handleTap}
                                isTop={true}
                                guests={guests}
                            />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mt-6 z-20">
                <button
                    onClick={handleRewind}
                    disabled={history.length === 0}
                    className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                >
                    <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                </button>

                <button
                    onClick={handleSwipeLeft}
                    className="w-16 h-16 rounded-full bg-white shadow-[0_8px_30px_rgba(239,68,68,0.2)] border border-red-50 flex items-center justify-center text-red-500 hover:scale-110 hover:bg-red-50 transition-all"
                >
                    <X className="w-8 h-8 stroke-[3]" />
                </button>

                <button
                    onClick={handleSwipeRight}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 shadow-[0_8px_30px_rgba(16,185,129,0.3)] flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_12px_40px_rgba(16,185,129,0.4)] transition-all"
                >
                    <Heart className="w-8 h-8 fill-white stroke-[3]" />
                </button>

                <button
                    onClick={handleTap}
                    className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-blue-500 hover:scale-110 transition-transform"
                >
                    <Info className="w-5 h-5 stroke-[2.5]" />
                </button>
            </div>
        </div>
    )
}
