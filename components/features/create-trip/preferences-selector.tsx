"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ThumbsUp, Check } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { cn } from '@/lib/utils'

interface PreferencesSelectorProps {
    selectedPrefs: string[]
    togglePref: (id: string) => void
    onNext: () => void
    onBack: () => void
}

const preferences = [
    { id: 'popular', label: 'Populare', emoji: '📌' },
    { id: 'museum', label: 'Muzee', emoji: '🏛️' },
    { id: 'nature', label: 'Natură', emoji: '🌿' },
    { id: 'foodie', label: 'Gastronomie', emoji: '🍕' },
    { id: 'history', label: 'Istorie', emoji: '📜' },
    { id: 'shopping', label: 'Cumpărături', emoji: '🛍️' },
]

export function PreferencesSelector({
    selectedPrefs,
    togglePref,
    onNext,
    onBack
}: PreferencesSelectorProps) {
    return (
        <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 p-0 flex flex-col bg-white"
        >
            <div className="p-8">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-neutral-900">
                    <ChevronLeft className="h-6 w-6" />
                </button>
            </div>

            <div className="flex-1 px-8 space-y-8 min-h-0 overflow-y-auto">
                <div className="h-16 w-16 bg-[#BBE5FC] rounded-3xl flex items-center justify-center text-3xl shadow-sm shrink-0">
                    <ThumbsUp className="h-8 w-8 text-primary" />
                </div>

                <div className="space-y-4 shrink-0">
                    <h2 className="text-5xl font-bold tracking-tighter text-foreground leading-[0.9]">Preferințe</h2>
                    <p className="text-gray-500 text-xl font-medium">Ce te interesează la această călătorie?</p>
                </div>

                <div className="flex flex-wrap gap-3 pb-8">
                    {preferences.map((pref) => (
                        <button
                            key={pref.id}
                            onClick={() => togglePref(pref.id)}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition-all shadow-sm border-2",
                                selectedPrefs.includes(pref.id)
                                    ? "bg-white border-primary text-foreground scale-105"
                                    : "bg-white border-white hover:border-gray-100 text-gray-500"
                            )}
                        >
                            <span>{pref.emoji}</span>
                            {pref.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-8 shrink-0">
                <Button
                    onClick={onNext}
                    className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full text-xl font-bold shadow-xl flex items-center justify-center gap-2"
                >
                    <Check className="h-6 w-6" />
                    Continuă
                </Button>
            </div>
        </motion.div>
    )
}
