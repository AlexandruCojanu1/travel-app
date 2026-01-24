"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, X, Sparkles, CheckCircle2, Users } from "lucide-react"
import { BusinessSwipeCard } from "@/components/features/explore/business-swipe-card"
import type { MapBusiness } from "@/services/business/business.service"
import { submitVote } from "@/actions/trip/vote"
import { toast } from "sonner"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"
import { useUIStore } from "@/store/ui-store"

interface GroupSwipeModeProps {
    businesses: MapBusiness[]
    tripId: string
    tripTitle?: string
}

export function GroupSwipeMode({ businesses, tripId, tripTitle }: GroupSwipeModeProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFinished, setIsFinished] = useState(false)
    const [matchAnimation, setMatchAnimation] = useState<string | null>(null) // Business name if matched
    const { openBusinessDrawer } = useUIStore()

    const currentBusiness = businesses[currentIndex]
    const nextBusiness = businesses[currentIndex + 1]

    const handleVote = useCallback(async (vote: boolean) => {
        if (!currentBusiness) return

        // Optimistic UI update
        const business = currentBusiness
        setCurrentIndex(prev => prev + 1)

        try {
            const result = await submitVote(tripId, business.id, vote)

            if (result.success && result.matched) {
                // Trigger Match Animation!
                setMatchAnimation(business.name)
                toast.success(`MATCH! ${business.name} a fost adăugat în plan! 🎉`)
            }
        } catch (error) {
            console.error("Vote failed:", error)
            toast.error("Eroare la salvarea votului.")
        }
    }, [currentBusiness, tripId])

    if (businesses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Momentan nu sunt activități</h3>
                <p className="text-gray-500 mb-8 max-w-md">
                    Nu am găsit activități noi disponibile pentru votare în această destinație.
                </p>
                <Button asChild>
                    <Link href={`/plan?tripId=${tripId}`}>Înapoi la Plan</Link>
                </Button>
            </div>
        )
    }

    if (currentIndex >= businesses.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Ai votat tot!</h3>
                <p className="text-gray-500 mb-8 max-w-md">
                    Ai trecut prin toate propunerile. Verifică planul pentru a vedea ce s-a decis în grup.
                </p>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <Link href={`/plan?tripId=${tripId}`}>Vezi Planul Final</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto h-[80vh] relative">

            {/* Match Overlay */}
            <AnimatePresence>
                {matchAnimation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl p-6 text-center"
                        onAnimationComplete={() => setTimeout(() => setMatchAnimation(null), 2500)}
                    >
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <Users className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 italic tracking-tighter">IT'S A MATCH!</h2>
                        <p className="text-white/80 text-lg">{matchAnimation} a fost adăugat în grup.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-6 flex flex-col items-center">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">
                    VOT GRUP
                </span>
                <h1 className="text-xl font-bold text-gray-900">
                    {tripTitle || "Găsește activități"}
                </h1>
            </div>

            <div className="relative w-full aspect-[3/4] max-h-[500px]">
                <AnimatePresence>
                    {nextBusiness && (
                        <div
                            key={nextBusiness.id + "-next"}
                            className="absolute inset-0 scale-95 opacity-50 translate-y-4"
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

                    <div key={currentBusiness.id} className="absolute inset-0">
                        <BusinessSwipeCard
                            business={currentBusiness}
                            onSwipeLeft={() => handleVote(false)}
                            onSwipeRight={() => handleVote(true)}
                            onTap={() => openBusinessDrawer(currentBusiness.id)}
                            isTop={true}
                        />
                    </div>
                </AnimatePresence>
            </div>

            <p className="mt-8 text-sm text-gray-400 font-medium">
                Swipe dreapta pentru a vota DA
            </p>
        </div>
    )
}
