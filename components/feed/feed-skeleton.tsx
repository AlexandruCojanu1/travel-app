import { Skeleton } from "@/components/shared/ui/skeleton"

export function FeedSkeleton() {
  return (
    <div className="space-y-8">
      {/* Quick Filters Skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full flex-none" />
        ))}
      </div>

      {/* Featured Carousel Skeleton */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex gap-4 overflow-hidden -mx-4 md:-mx-6 px-4 md:px-6">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="flex-none w-[85vw] md:w-[400px] h-[280px] md:h-[320px] rounded-2xl"
            />
          ))}
        </div>
      </div>

      {/* News Section Skeleton */}
      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 bg-white rounded-xl p-4">
              {/* Image */}
              <Skeleton className="flex-none w-24 h-24 rounded-lg" />
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
