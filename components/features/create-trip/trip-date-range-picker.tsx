"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'

interface TripDateRangePickerProps {
    startDate: string
    endDate: string
    setStartDate: (date: string) => void
    setEndDate: (date: string) => void
    onNext: () => void
    onBack: () => void
}

export function TripDateRangePicker({
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    onNext,
    onBack
}: TripDateRangePickerProps) {
    const duration = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))

    return (
        <motion.div
            key="step2"
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

            <div className="px-8 pt-4 pb-0 space-y-1">
                <h2 className="text-4xl font-extrabold tracking-tighter text-foreground">Când plecăm?</h2>
                <p className="text-gray-600 text-lg font-medium">Alege perioada călătoriei</p>
            </div>

            <div className="flex-1 px-8 flex flex-col items-center justify-center space-y-8">
                {/* Start Date */}
                <div className="w-full space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Data sosirii</label>
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white shadow-lg p-1 group focus-within:border-mova-blue transition-colors">
                        <div className="flex items-center px-4 py-3 gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-mova-blue" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-transparent font-bold text-lg text-gray-900 outline-none p-0"
                            />
                        </div>
                    </div>
                </div>

                {/* End Date */}
                <div className="w-full space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Data plecării</label>
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white shadow-lg p-1 group focus-within:border-mova-blue transition-colors">
                        <div className="flex items-center px-4 py-3 gap-3">
                            <ArrowRight className="h-5 w-5 text-gray-400 group-focus-within:text-mova-blue" />
                            <input
                                type="date"
                                min={startDate}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-transparent font-bold text-lg text-gray-900 outline-none p-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Duration Display */}
                <div className="py-4 px-6 bg-white/50 rounded-2xl border border-white/50 shadow-sm">
                    <p className="text-center font-medium text-gray-600">
                        Durată: <span className="text-mova-dark font-bold text-lg">
                            {duration} nopți
                        </span>
                    </p>
                </div>
            </div>

            <div className="p-8">
                <Button
                    onClick={onNext}
                    disabled={!startDate || !endDate || new Date(endDate) < new Date(startDate)}
                    className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full text-xl font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Confirmă Perioada
                </Button>
            </div>
        </motion.div>
    )
}
