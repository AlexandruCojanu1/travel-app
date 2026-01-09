"use client"

import React from 'react'
import Image from 'next/image'
import { format, differenceInDays } from 'date-fns'
import { ro } from 'date-fns/locale'

interface TripSummaryCardProps {
    title: string
    cityName?: string
    startDate: string
    endDate: string
    spotsCount: number
    imageUrl?: string | null
    onClick?: () => void
}

const CITY_IMAGES: Record<string, string> = {
    // Generated Icons
    'Alba Iulia': '/icons/city-alba-iulia-v2.png',
    'Arad': '/icons/city-arad.png',
    'Brașov': '/icons/city-brasov.png',
    'București': '/icons/city-bucharest.png',
    'Cluj-Napoca': '/icons/city-cluj.png',
    'Constanța': '/icons/city-constanta.png',
    'Craiova': '/icons/city-craiova.png',
    'Iași': '/icons/city-iasi.png',
    'Oradea': '/icons/city-oradea.png',
    'Ploiești': '/icons/city-ploiesti.png',
    'Sibiu': '/icons/city-sibiu.png',
    'Sighișoara': '/icons/city-sighisoara.png',
    'Sinaia': '/icons/city-sinaia.png',
    'Suceava': '/icons/city-suceava.png',
    'Târgu Mureș': '/icons/city-targu-mures.png',
    'Timișoara': '/icons/city-timisoara.png',
    'Tulcea': '/icons/city-tulcea.png',

    // Generic Fallback for Remaining County Seats
    'Alexandria': '/icons/city-generic.png',
    'Bacău': '/icons/city-generic.png',
    'Baia Mare': '/icons/city-generic.png',
    'Bistrița': '/icons/city-generic.png',
    'Botoșani': '/icons/city-generic.png',
    'Brăila': '/icons/city-generic.png',
    'Buftea': '/icons/city-generic.png',
    'Buzău': '/icons/city-generic.png',
    'Călărași': '/icons/city-generic.png',
    'Deva': '/icons/city-generic.png',
    'Drobeta-Turnu Severin': '/icons/city-generic.png',
    'Focșani': '/icons/city-generic.png',
    'Galați': '/icons/city-generic.png',
    'Giurgiu': '/icons/city-generic.png',
    'Miercurea Ciuc': '/icons/city-generic.png',
    'Piatra Neamț': '/icons/city-generic.png',
    'Pitești': '/icons/city-generic.png',
    'Râmnicu Vâlcea': '/icons/city-generic.png',
    'Reșița': '/icons/city-generic.png',
    'Satu Mare': '/icons/city-generic.png',
    'Sfântu Gheorghe': '/icons/city-generic.png',
    'Slatina': '/icons/city-generic.png',
    'Slobozia': '/icons/city-generic.png',
    'Târgoviște': '/icons/city-generic.png',
    'Târgu Jiu': '/icons/city-generic.png',
    'Vaslui': '/icons/city-generic.png',
    'Zalău': '/icons/city-generic.png',
}

const DEFAULT_IMAGE = '/icons/city-generic.png'

export function TripSummaryCard({ title, cityName, startDate, endDate, spotsCount, imageUrl, onClick }: TripSummaryCardProps) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = differenceInDays(end, start) + 1
    const nights = days > 1 ? days - 1 : 0

    // Determine the display image
    // 1. Use image provided via props
    // 2. Lookup city name in predefined images
    // 3. Fallback to default travel image
    const displayImage = imageUrl || (cityName ? CITY_IMAGES[cityName] : null) || DEFAULT_IMAGE

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 p-4 bg-[#F2F6FF] rounded-[32px] cursor-pointer hover:shadow-md transition-all duration-300 w-full"
        >
            {/* Trip Image */}
            <div className="relative w-24 h-24 rounded-[24px] overflow-hidden bg-slate-200 flex-shrink-0">
                <Image
                    src={displayImage}
                    alt={title}
                    fill
                    sizes="96px"
                    className="object-cover"
                />
            </div>

            {/* Trip Info */}
            <div className="flex flex-col justify-center flex-1">
                <h3 className="text-primary font-black text-xl leading-tight mb-2 tracking-tight">
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
