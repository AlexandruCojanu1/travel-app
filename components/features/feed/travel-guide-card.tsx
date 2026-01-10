"use client"

import React from 'react'
import Image from 'next/image'
import { MapPin } from 'lucide-react'

interface TravelGuideCardProps {
    title: string
    city: string
    spotsCount: number
    imageUrl: string
    onClick?: () => void
    priority?: boolean
}

export function TravelGuideCard({ title, city, spotsCount, imageUrl, onClick, priority = false }: TravelGuideCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative flex-shrink-0 w-[160px] h-[220px] sm:w-[240px] sm:h-[280px] rounded-[24px] sm:rounded-[32px] overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-500"
        >
            {/* Background Image */}
            <Image
                src={imageUrl}
                alt={title}
                fill
                priority={priority}
                sizes="240px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* City Tag */}
            <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/10">
                <MapPin className="h-3 w-3 text-primary fill-primary" />
                <span className="text-xs font-bold text-foreground">{city}</span>
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white font-bold text-lg leading-tight mb-1">{title}</h3>
                <p className="text-white/80 text-sm font-medium">{spotsCount} Locații</p>
            </div>
        </div>
    )
}
