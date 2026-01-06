"use client"

import React, { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

interface VerticalPickerProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    className?: string
}

export function VerticalPicker({
    value,
    onChange,
    min = 1,
    max = 30,
    className
}: VerticalPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [items, setItems] = useState<number[]>([])

    useEffect(() => {
        const newItems = []
        for (let i = min; i <= max; i++) {
            newItems.push(i)
        }
        setItems(newItems)
    }, [min, max])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget
        const itemHeight = 64 // Approximate item height
        const scrollPos = container.scrollTop
        const selectedIndex = Math.round(scrollPos / itemHeight)
        const newValue = items[selectedIndex]

        if (newValue !== undefined && newValue !== value) {
            onChange(newValue)
        }
    }

    // Initial scroll to current value
    useEffect(() => {
        if (containerRef.current) {
            const index = items.indexOf(value)
            if (index !== -1) {
                containerRef.current.scrollTop = index * 64
            }
        }
    }, [items])

    return (
        <div className={`relative h-64 overflow-hidden ${className}`}>
            {/* Target Highlight */}
            <div className="absolute top-1/2 left-0 right-0 h-16 -translate-y-1/2 bg-gray-50 rounded-2xl border-y border-gray-100/50 pointer-events-none z-0" />

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-scroll no-scrollbar py-24 snap-y snap-mandatory"
            >
                {items.map((item) => (
                    <div
                        key={item}
                        className="h-16 flex items-center justify-center snap-center"
                    >
                        <motion.span
                            animate={{
                                scale: value === item ? 1.5 : 1,
                                opacity: value === item ? 1 : 0.4,
                                color: value === item ? '#1A1A1A' : '#A4A4A4'
                            }}
                            className="text-3xl font-bold tracking-tighter"
                        >
                            {item}
                        </motion.span>
                    </div>
                ))}
            </div>
        </div>
    )
}
