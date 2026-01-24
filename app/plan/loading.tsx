"use client"

import { Skeleton } from "@/components/shared/ui/skeleton"

export default function PlanLoading() {
    return (
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 pb-8">
            {/* Header Skeleton */}
            <div className="flex items-start justify-between">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" /> {/* Back button */}
                    <Skeleton className="h-10 w-64" /> {/* Title */}
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-48" /> {/* Date */}
                    </div>
                </div>
            </div>

            {/* Budget Meter Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-4 w-full rounded-full mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </div>

            {/* Wallet Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <Skeleton className="h-8 w-40 mb-4" />
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </div>

            {/* Weather Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-8 w-24 ml-auto" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 md:flex md:items-center gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full md:w-32 rounded-lg" />
                ))}
            </div>

            {/* Timeline Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-48 mb-4" /> {/* Section Title */}
                <div className="relative pl-8 border-l-2 border-gray-100 space-y-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="relative">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[39px] top-4 h-5 w-5 rounded-full bg-gray-200 border-4 border-white" />

                            {/* Card Skeleton */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-6 w-16" /> {/* Time */}
                                    <Skeleton className="h-6 w-24" /> {/* Category */}
                                </div>
                                <div className="flex gap-4">
                                    <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
