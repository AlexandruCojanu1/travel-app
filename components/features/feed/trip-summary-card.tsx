"use client"

import React from 'react'
import Image from 'next/image'
import { format, differenceInDays } from 'date-fns'
import { ro } from 'date-fns/locale'

interface TripSummaryCardProps {
    title: string
    startDate: string
    endDate: string
    spotsCount: number
    imageUrl?: string | null
    onClick?: () => void
}

export function TripSummaryCard({ title, startDate, endDate, spotsCount, imageUrl, onClick }: TripSummaryCardProps) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = differenceInDays(end, start) + 1
    const nights = days > 1 ? days - 1 : 0

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 p-4 bg-[#F2F6FF] rounded-[32px] cursor-pointer hover:shadow-md transition-all duration-300 w-full"
        >
            {/* Trip Image */}
            <div className="relative w-24 h-24 rounded-[24px] overflow-hidden bg-slate-200 flex-shrink-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        sizes="96px"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm" />
                    </div>
                )}
            </div>

            {/* Trip Info */}
            <div className="flex flex-col justify-center flex-1">
                <h3 className="text-[#003CFF] font-black text-xl leading-tight mb-2 tracking-tight">
                    {title}
                </h3>
                <div className="space-y-0.5">
                    <p className="text-[#899BBC] text-sm font-bold">
                        {days} Zile {nights > 0 ? `${nights} Nopți` : ''}
                    </p>
                    <p className="text-[#899BBC] text-sm font-bold">
                        {spotsCount} Locații
                    </p>
                </div>
            </div>
        </div>
    )
}
