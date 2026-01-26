"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"

interface StampProps {
    name: string
    date: string
    iconUrl?: string
    variant?: 'pristine' | 'weathered'
    isNew?: boolean
}

export function Stamp({ name, date, iconUrl, variant = 'pristine', isNew = false }: StampProps) {
    // Random rotation for realism (-12deg to 12deg)
    const rotation = useMemo(() => Math.random() * 24 - 12, [])

    // Stamp Ink Color Variants
    const inkColors = ['text-indigo-900', 'text-blue-900', 'text-slate-800', 'text-violet-900']
    const colorClass = useMemo(() => inkColors[Math.floor(Math.random() * inkColors.length)], [])

    return (
        <motion.div
            initial={isNew ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            style={{ rotate: rotation }}
            className={`
                relative w-24 h-24 rounded-full border-4 border-dashed
                flex flex-col items-center justify-center p-2 text-center select-none
                ${colorClass}
                ${variant === 'weathered' ? 'opacity-60 blur-[0.5px] border-double' : 'opacity-90 border-dashed'}
            `}
        >
            {/* Ink Splatter / Grunge Effect overlay */}
            <div className="absolute inset-0 rounded-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/shattered-island.png')]" />

            {/* Inner Content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* City/Badge Name */}
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                    {name}
                </span>

                {/* Icon */}
                {iconUrl ? (
                    <img src={iconUrl} alt="icon" className="w-8 h-8 opacity-80 mix-blend-multiply" />
                ) : (
                    <div className="w-8 h-8 rounded-full border border-current opacity-50" />
                )}

                {/* Date */}
                <span className="text-[9px] font-mono mt-1 border-t border-current pt-0.5">
                    {new Date(date).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
            </div>

            {/* "Wet Ink" - Shine Effect if new */}
            {isNew && (
                <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 3, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-white blur-md"
                    style={{ mixBlendMode: "overlay" }}
                />
            )}
        </motion.div>
    )
}
