"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Slider } from '@/components/shared/ui/slider'

interface BudgetEstimatorProps {
    budget: number[]
    setBudget: (val: number[]) => void
    travelers: number
    onFinish: () => void
    onBack: () => void
}

export function BudgetEstimator({
    budget,
    setBudget,
    travelers,
    onFinish,
    onBack
}: BudgetEstimatorProps) {
    return (
        <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 p-8 space-y-12 flex flex-col bg-white"
        >
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </button>
            </div>

            <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight text-foreground">Aproape gata!</h2>
                <p className="text-gray-500 text-lg">Care este bugetul total estimat?</p>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-12 min-h-0">
                <div className="text-center space-y-2">
                    <p className="text-6xl font-black tracking-tighter text-primary">
                        {budget[0].toLocaleString()} <span className="text-3xl text-gray-400">RON</span>
                    </p>
                    <p className="text-sm text-gray-400 font-medium">
                        ~{(budget[0] / travelers).toFixed(0)} RON / persoană
                    </p>
                </div>

                <div className="px-4">
                    <Slider
                        value={budget}
                        onValueChange={setBudget}
                        min={500 * travelers} // Adjusted min based on travelers
                        max={20000 * travelers} // Adjusted max
                        step={100}
                        className="w-full"
                    />
                    <div className="flex justify-between mt-4 text-sm font-bold text-gray-400">
                        <span>{(500 * travelers).toLocaleString()} RON</span>
                        <span>{(20000 * travelers).toLocaleString()} RON</span>
                    </div>
                </div>
            </div>

            <Button
                onClick={onFinish}
                className="w-full h-16 bg-primary text-white hover:bg-primary/90 rounded-full text-xl font-bold shadow-xl shrink-0"
            >
                Creează Călătoria
            </Button>
        </motion.div>
    )
}
