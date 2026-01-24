import { FeedSkeleton } from "@/components/features/feed/feed-skeleton"
import { Skeleton } from "@/components/shared/ui/skeleton"

export default function HomeLoading() {
    return (
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 pb-20">
            {/* City Selector Header Skeleton */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md pb-4 pt-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-48" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed Column */}
                <div className="lg:col-span-2 space-y-6">
                    <FeedSkeleton />
                </div>

                {/* Sidebar Column */}
                <div className="hidden lg:block space-y-6">
                    <Skeleton className="h-40 w-full rounded-2xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    )
}
