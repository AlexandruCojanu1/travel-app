"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { MapPin, Star, Heart, X, Info, Bookmark, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MapBusiness } from "@/services/business/business.service"

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
    const rotate = useTransform(x, [-200, 200], [-25, 25])
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
            {/* Card Container */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white">
                {/* Business Image */}
                <div className="absolute inset-0">
                    {business.image_url && (business.image_url.startsWith('http') || business.image_url.startsWith('/')) ? (
                        <Image
                            src={business.image_url}
                            alt={business.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-8xl">{getCategoryEmoji(business.category)}</span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Like Indicator */}
                <motion.div
                    className="absolute top-8 left-8 px-6 py-3 rounded-xl border-4 border-green-500 bg-green-500/20 backdrop-blur-sm"
                    style={{ opacity: likeOpacity }}
                >
                    <span className="text-3xl font-black text-green-500 tracking-wider">LIKE</span>
                </motion.div>

                {/* Nope Indicator */}
                <motion.div
                    className="absolute top-8 right-8 px-6 py-3 rounded-xl border-4 border-red-500 bg-red-500/20 backdrop-blur-sm"
                    style={{ opacity: nopeOpacity }}
                >
                    <span className="text-3xl font-black text-red-500 tracking-wider">NOPE</span>
                </motion.div>

                {/* Category Badge */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
                        <span className="text-sm font-semibold text-gray-800">
                            {getCategoryEmoji(business.category)} {business.category}
                        </span>
                    </div>
                </div>

                {/* Business Info */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
                    {/* Name & Rating */}
                    <div className="space-y-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg line-clamp-2">
                            {business.name}
                        </h2>

                        <div className="flex flex-wrap items-center gap-2">
                            {business.rating && (
                                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-white font-semibold text-sm">{business.rating.toFixed(1)}</span>
                                </div>
                            )}

                            {/* Price Level & Dynamic Cost */}
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <span className="text-white font-medium text-sm">
                                    {business.price_level || '€€'}
                                </span>
                                {business.category.toLowerCase().includes('hotel') && (
                                    <>
                                        <span className="text-white/40">|</span>
                                        <span className="text-white font-bold text-sm">
                                            {/* Estimate price: €=50, €€=150, €€€=400 per person/night */}
                                            {(() => {
                                                const level = business.price_level || '€€'
                                                const basePrice = level === '€' ? 50 : level === '€€€' ? 400 : 150
                                                const totalPrice = basePrice * guests
                                                return `~${totalPrice} RON (${guests} pers)`
                                            })()}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {business.description && (
                            <p className="text-white/90 text-sm md:text-base line-clamp-2 leading-relaxed max-w-[90%] drop-shadow-md">
                                {business.description}
                            </p>
                        )}

                        {/* Address */}
                        {business.address && (
                            <div className="flex items-center gap-1.5 text-white/70 text-xs md:text-sm mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{business.address}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
