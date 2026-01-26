"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { MapPin, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MapBusiness } from "@/actions/business"

interface BusinessSwipeCardProps {
    business: MapBusiness
    onSwipeLeft: () => void
    onSwipeRight: () => void
    onTap: () => void
    isTop: boolean
    guests?: number
}

export function BusinessSwipeCard({
    business,
    onSwipeLeft,
    onSwipeRight,
    onTap,
    isTop,
    guests = 2
}: BusinessSwipeCardProps) {
    const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)

    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-15, 15])
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

    // Overlay indicators
    const likeOpacity = useTransform(x, [0, 100], [0, 1])
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 100
        if (info.offset.x > threshold) {
            setExitDirection("right")
            onSwipeRight()
        } else if (info.offset.x < -threshold) {
            setExitDirection("left")
            onSwipeLeft()
        }
    }

    const getCategoryEmoji = (category: string) => {
        const emojis: Record<string, string> = {
            'restaurant': '🍽️',
            'cafe': '☕',
            'bar': '🍸',
            'hotel': '🏨',
            'attraction': '🎢',
            'museum': '🏛️',
            'park': '🌳',
            'shop': '🛍️',
            'spa': '💆',
            'gym': '💪',
        }
        return emojis[category.toLowerCase()] || '📍'
    }

    return (
        <motion.div
            className={cn(
                "absolute w-full h-full cursor-grab active:cursor-grabbing",
                !isTop && "pointer-events-none"
            )}
            style={{ x, rotate, opacity }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            animate={exitDirection ? {
                x: exitDirection === "right" ? 500 : -500,
                opacity: 0,
                transition: { duration: 0.3 }
            } : {}}
            onClick={isTop ? onTap : undefined}
        >
            {/* Card Container - Split Layout */}
            <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl bg-white flex flex-col">

                {/* 1. Image Section (~65%) */}
                <div className="relative h-[65%] w-full bg-gray-200">
                    {business.image_url && (business.image_url.startsWith('http') || business.image_url.startsWith('/')) ? (
                        <Image
                            src={business.image_url}
                            alt={business.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                            priority={isTop}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-8xl">{getCategoryEmoji(business.category)}</span>
                        </div>
                    )}

                    {/* Rating Badge - Top Left */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full z-10">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-bold text-sm">
                            {business.rating ? business.rating.toFixed(1) : 'New'}
                        </span>
                    </div>

                    {/* Like/Nope Overlays */}
                    <motion.div
                        className="absolute top-8 left-8 z-20 px-6 py-2 rounded-xl border-4 border-green-500 bg-green-500/20 backdrop-blur-sm -rotate-12"
                        style={{ opacity: likeOpacity }}
                    >
                        <span className="text-2xl font-black text-green-500 tracking-wider">YES</span>
                    </motion.div>

                    <motion.div
                        className="absolute top-8 right-8 z-20 px-6 py-2 rounded-xl border-4 border-red-500 bg-red-500/20 backdrop-blur-sm rotate-12"
                        style={{ opacity: nopeOpacity }}
                    >
                        <span className="text-2xl font-black text-red-500 tracking-wider">NOPE</span>
                    </motion.div>
                </div>

                {/* 2. Content Section (~35%) */}
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight line-clamp-2 pr-2">
                                {business.name}
                            </h2>
                            {business.category.toLowerCase().includes('hotel') || business.category.toLowerCase().includes('attraction') ? (
                                <div className="bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                                    <span className="text-gray-900 font-bold text-sm">
                                        {(() => {
                                            const level = business.price_level || '€€'
                                            const basePrice = level === '€' ? 50 : level === '€€€' ? 400 : 150
                                            return `€ ${basePrice}`
                                        })()}
                                    </span>
                                </div>
                            ) : (
                                <div className="bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                                    <span className="text-gray-900 font-bold text-sm">
                                        {business.price_level || '€€'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-3">
                            {business.description || `Experience the best ${business.category} in town. Great atmosphere and amazing service awaiting you.`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
                        {getCategoryEmoji(business.category)} {business.category}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
