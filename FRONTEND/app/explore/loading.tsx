import { Skeleton } from "@/components/shared/ui/skeleton"

export default function ExploreLoading() {
    return (
        <div className="fixed inset-0 top-0 md:top-[72px] bg-neutral-900 overflow-hidden flex flex-col">
            {/* Header Skeleton */}
            <div className="pt-6 px-6 pb-2 bg-neutral-900 z-20 shrink-0 flex flex-col items-center">
                <Skeleton className="h-4 w-32 mb-2 bg-neutral-800" /> {/* DESTINATION LABEL */}
                <Skeleton className="h-12 w-64 bg-neutral-800" /> {/* CITY NAME */}
            </div>

            {/* Card Stack Skeleton */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4">
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-800 border border-neutral-700 shadow-xl">
                    {/* Image Placeholder */}
                    <div className="absolute inset-0 bg-neutral-800 animate-pulse" />

                    {/* Content Overlay Skeleton */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20">
                        <Skeleton className="h-8 w-3/4 mb-2 bg-white/20" /> {/* Title */}
                        <Skeleton className="h-4 w-1/2 mb-4 bg-white/20" /> {/* Subtitle */}

                        {/* Tags */}
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-20 rounded-full bg-white/20" />
                            <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons Skeleton (Bottom) */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 z-20">
                <Skeleton className="h-14 w-14 rounded-full bg-neutral-800 border border-neutral-700" /> {/* Pass */}
                <Skeleton className="h-14 w-14 rounded-full bg-neutral-800 border border-neutral-700" /> {/* Super Like */}
                <Skeleton className="h-14 w-14 rounded-full bg-neutral-800 border border-neutral-700" /> {/* Like */}
            </div>
        </div>
    )
}
