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
    fullWidth?: boolean
}

export function TravelGuideCard({ title, city, spotsCount, imageUrl, onClick, priority = false, fullWidth = false }: TravelGuideCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-500 ${fullWidth
                ? 'w-full h-[280px] sm:h-[350px] rounded-[24px]'
                : 'flex-shrink-0 w-[160px] h-[220px] sm:w-[240px] sm:h-[280px] rounded-[24px] sm:rounded-[32px]'
                }`}
        >
            {/* Background Image */}
            <Image
                src={imageUrl}
                alt={title}
                fill
                priority={priority}
                sizes={fullWidth ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 160px, 240px"}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <h3 className={`text-white font-bold leading-tight mb-1 ${fullWidth ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>{title}</h3>
            </div>
        </div>
    )
}

