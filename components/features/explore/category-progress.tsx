"use client"

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SwipeCategory = 'hotel' | 'restaurants' | 'activities'

interface CategoryProgressProps {
    currentCategory: SwipeCategory
    completedCategories: SwipeCategory[]
    selectedHotel?: { name: string; image_url: string | null } | null
}

const CATEGORIES: { id: SwipeCategory; label: string; emoji: string }[] = [
    { id: 'hotel', label: 'Cazare', emoji: '🏨' },
    { id: 'restaurants', label: 'Restaurante', emoji: '🍽️' },
    { id: 'activities', label: 'Activități', emoji: '🎯' },
]

export function CategoryProgress({
    currentCategory,
    completedCategories,
    selectedHotel
}: CategoryProgressProps) {
    const currentIndex = CATEGORIES.findIndex(c => c.id === currentCategory)

    return (
        <div className="w-full max-w-md mx-auto mb-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 mx-10">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${(currentIndex / (CATEGORIES.length - 1)) * 100}%` }}
                    />
                </div>

                {CATEGORIES.map((category, index) => {
                    const isCompleted = completedCategories.includes(category.id)
                    const isCurrent = category.id === currentCategory
                    const isPast = index < currentIndex

                    return (
                        <div key={category.id} className="flex flex-col items-center z-10">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                    isCompleted
                                        ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                        : isCurrent
                                            ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/30 scale-110"
                                            : "bg-slate-100 text-slate-400"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <span className="text-lg">{category.emoji}</span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-semibold mt-2 transition-colors",
                                    isCurrent ? "text-slate-900" : "text-slate-400"
                                )}
                            >
                                {category.label}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Selected Hotel Preview */}
            {selectedHotel && currentCategory !== 'hotel' && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🏨</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-600 font-medium">Cazare selectată</p>
                        <p className="text-sm font-bold text-green-800 truncate">{selectedHotel.name}</p>
                    </div>
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                </div>
            )}
        </div>
    )
}
