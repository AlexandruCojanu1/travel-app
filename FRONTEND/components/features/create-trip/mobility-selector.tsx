"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Car, Bus, Check } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { cn } from '@/lib/utils'

interface MobilitySelectorProps {
    mobility: string
    setMobility: (id: string) => void
    onNext: () => void
    onBack: () => void
}

const mobilityOptions = [
    { id: 'car_personal', label: 'Mașină Personală', icon: Car },
    { id: 'car_rental', label: 'Mașină Închiriată', icon: Car },
    { id: 'public_transport', label: 'Transport Public', icon: Bus },
    { id: 'rideshare', label: 'Ridesharing / Taxi', icon: Car },
]

export function MobilitySelector({
    mobility,
    setMobility,
    onNext,
    onBack
}: MobilitySelectorProps) {
    return (
        <motion.div
            key="step4"
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
                <h2 className="text-4xl font-extrabold tracking-tighter text-foreground">Logistică</h2>
                <p className="text-gray-500 text-lg font-medium">Cum vă veți deplasa?</p>
            </div>

            <div className="flex-1 px-8 py-6 space-y-4 min-h-0 overflow-y-auto">
                {mobilityOptions.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setMobility(opt.id)}
                        className={cn(
                            "w-full flex items-center justify-between p-5 rounded-[24px] border-2 transition-all",
                            mobility === opt.id
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-gray-50 hover:border-gray-100 bg-white"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-2xl",
                                mobility === opt.id ? "bg-primary/10 text-primary" : "bg-gray-50 text-gray-400"
                            )}>
                                <opt.icon className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-lg text-foreground">{opt.label}</span>
                        </div>
                        {mobility === opt.id && (
                            <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white stroke-[3]" />
                            </div>
                        )}
                    </button>
                ))}
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
