"use client"

import React, { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

const ITEM_HEIGHT = 80
const CIRCLE_RADIUS = 400
const MAX_ANGLE = 50

interface CitySelectorProps {
    cities: Array<{ id: string; name: string; country: string }>
    onSelect: (city: any) => void
    onClose: () => void
}

export function CitySelector({ cities, onSelect, onClose }: CitySelectorProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerHeight, setContainerHeight] = useState(600)
    const [searchTerm, setSearchTerm] = useState('')

    // Optimize filtering with useMemo
    const filteredCities = React.useMemo(() => {
        if (!searchTerm) return cities
        const lowerTerm = searchTerm.toLowerCase()
        return cities.filter(city =>
            city.name.toLowerCase().includes(lowerTerm) ||
            city.country.toLowerCase().includes(lowerTerm)
        )
    }, [cities, searchTerm])

    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight)
            }
        }
        updateHeight()
        window.addEventListener('resize', updateHeight)
        return () => window.removeEventListener('resize', updateHeight)
    }, [])

    const spacerHeight = (containerHeight / 2) - (ITEM_HEIGHT / 2)

    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col bg-white text-neutral-900 overflow-hidden"
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex items-center justify-between">
                <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-neutral-900">
                    <ChevronLeft className="h-6 w-6" />
                </button>
            </div>

            <div className="absolute top-20 left-0 right-0 px-8 z-20 flex flex-col gap-6 pointer-events-none">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 text-center">
                    Unde mergi?
                </h2>

                {/* Search Input - Pointer events enabled */}
                <div className="pointer-events-auto max-w-sm mx-auto w-full">
                    <input
                        type="text"
                        placeholder="Caută oraș..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 px-6 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-black/5 outline-none text-lg font-medium placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Circle Arc - Only show if enough items and no search term (optional, or always show but adjust) */}
            {/* Hiding arc when searching might be cleaner if list is short, but let's keep it for visual consistency unless filtered list is small */}
            <div
                className="absolute top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 pointer-events-none z-0"
                style={{
                    width: 200,
                    height: 200,
                    left: -100,
                }}
            />

            {/* Scroll Container */}
            <div
                ref={containerRef}
                className="absolute inset-0 overflow-y-auto no-scrollbar snap-y snap-mandatory"
                style={{
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingTop: 200, // Push content down below search input
                }}
            >
                {/* Spacer to push first item to center */}
                <div style={{ height: spacerHeight - 200 }} />

                <div className="flex flex-col">
                    {filteredCities.map((city, i) => (
                        <CityItem
                            key={city.id}
                            city={city}
                            containerRef={containerRef}
                            index={i}
                            spacerHeight={spacerHeight}
                            onClick={() => onSelect(city)}
                        />
                    ))}
                    {filteredCities.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            Nu am găsit rezultate pentru "{searchTerm}"
                        </div>
                    )}
                </div>

                {/* Spacer to allow last item to reach center */}
                <div style={{ height: spacerHeight }} />
            </div>

            {/* Scroll Indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-20 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-full h-6 bg-gray-300 rounded-full" />
            </div>
        </motion.div>
    )
}

function CityItem({ city, containerRef, index, spacerHeight, onClick }: {
    city: any,
    containerRef: React.RefObject<HTMLDivElement>,
    index: number,
    spacerHeight: number,
    onClick: () => void
}) {
    const { scrollY } = useScroll({ container: containerRef, layoutEffect: false })

    const distanceFromCenter = useTransform(scrollY, (value) => {
        const container = containerRef.current
        if (!container) return 0

        const viewportHeight = container.clientHeight
        const centerY = viewportHeight / 2
        const scrollTop = value
        const itemCenter = spacerHeight + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2) - scrollTop

        return itemCenter - centerY
    })

    const normalized = useTransform(distanceFromCenter, (d) => {
        const maxDist = 400
        return Math.max(-1, Math.min(1, d / maxDist))
    })

    const rotateZ = useTransform(normalized, [-1, 0, 1], [-MAX_ANGLE, 0, MAX_ANGLE])

    const xOffset = useTransform(normalized, (n) => {
        const angle = n * (MAX_ANGLE * Math.PI / 180)
        const arcOffset = CIRCLE_RADIUS * (1 - Math.cos(angle))
        return -arcOffset
    })

    const absNormalized = useTransform(normalized, (n) => Math.abs(n))
    const scale = useTransform(absNormalized, [0, 0.3, 1], [1.1, 0.7, 0.4])
    const opacity = useTransform(absNormalized, [0, 0.3, 1], [1, 0.5, 0.15])
    const fontWeight = useTransform(absNormalized, [0, 0.3, 1], [700, 500, 400])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
        }
    }

    return (
        <motion.div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            aria-label={`Selectează ${city.name}`}
            style={{
                height: ITEM_HEIGHT,
                scale,
                opacity,
                rotate: rotateZ,
                x: xOffset,
                transformOrigin: "left center",
            }}
            className="flex items-center snap-center cursor-pointer pl-[100px] outline-none focus:ring-2 focus:ring-mova-blue focus:ring-offset-2 rounded-xl"
        >
            <motion.span
                style={{ fontWeight }}
                className="text-4xl tracking-tight whitespace-nowrap"
            >
                {city.name}
            </motion.span>
        </motion.div>
    )
}
