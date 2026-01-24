"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, User, Users, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { cn } from '@/lib/utils'

interface TripTypeSelectorProps {
    protagonist: string
    setProtagonist: (id: string) => void
    travelers: number
    setTravelers: (count: number) => void
    onNext: () => void
    onBack: () => void
}

const protagonistOptions = [
    { id: 'solo', label: 'Solo', icon: User, description: 'Doar eu și lumea' },
    { id: 'couple', label: 'Cuplu', icon: Users, description: 'O escapadă romantică' },
    { id: 'family', label: 'Familie', icon: Users, description: 'Distracție pentru toți' },
    { id: 'friends', label: 'Prieteni', icon: Users, description: 'Grup de aventurieri' },
]

export function TripTypeSelector({
    protagonist,
    setProtagonist,
    travelers,
    setTravelers,
    onNext,
    onBack
}: TripTypeSelectorProps) {
    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 p-0 flex flex-col bg-white"
        >
            <div className="p-8 pb-0">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-neutral-900">
                    <ChevronLeft className="h-6 w-6" />
                </button>
            </div>

            <div className="px-8 pt-4 space-y-1">
                <h2 className="text-4xl font-extrabold tracking-tighter text-foreground">Cine sunteți?</h2>
                <p className="text-gray-500 text-lg font-medium">Cu cine călătorești această dată?</p>
            </div>

            <div className="flex-1 px-8 py-6 flex flex-col space-y-8 min-h-0 overflow-y-auto">
                {/* Protagonist Type */}
                <div className="grid grid-cols-2 gap-3">
                    {protagonistOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setProtagonist(opt.id)}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 text-center",
                                protagonist === opt.id
                                    ? "border-secondary bg-secondary/10 shadow-sm"
                                    : "border-gray-100 bg-white hover:border-gray-200"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                                protagonist === opt.id ? "bg-secondary/20 text-secondary" : "bg-gray-100 text-gray-500"
                            )}>
                                <opt.icon className="h-6 w-6" />
                            </div>
                            <p className="font-bold text-sm text-foreground">{opt.label}</p>
                            <p className="text-[10px] text-gray-400 font-medium leading-tight">{opt.description}</p>
                        </button>
                    ))}
                </div>

                {/* Count */}
                <div className="bg-white/50 p-6 rounded-[32px] border border-white/50 space-y-4">
                    <p className="text-center font-bold text-gray-500 uppercase text-xs tracking-wider">Câte persoane</p>
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={() => setTravelers(Math.max(1, travelers - 1))}
                            className="w-14 h-14 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-all text-gray-600"
                        >
                            <Minus className="h-6 w-6" />
                        </button>
                        <span className="text-5xl font-black text-foreground w-16 text-center">{travelers}</span>
                        <button
                            onClick={() => setTravelers(Math.min(10, travelers + 1))}
                            className="w-14 h-14 rounded-full bg-black shadow-lg flex items-center justify-center active:scale-95 transition-all text-white"
                        >
                            <Plus className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <Button
                    onClick={onNext}
                    className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full text-xl font-bold shadow-xl"
                >
                    Confirmă
                </Button>
            </div>
        </motion.div>
    )
}
