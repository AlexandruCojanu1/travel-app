"use client"

import { Star, MapPin, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Database } from "@/types/database.types"
import { cn } from "@/lib/utils"

type Business = Database['public']['Tables']['businesses']['Row']

interface FeaturedCarouselProps {
  businesses: Business[]
}

export function FeaturedCarousel({ businesses }: FeaturedCarouselProps) {
  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No featured places available</p>
      </div>
    )
  }

  return (
    <div className="relative -mx-4 md:-mx-6">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 md:px-6 pb-4 no-scrollbar">
        {businesses.map((business, index) => (
          <Link
            key={business.id}
            href={`/business/${business.id}`}
            className="relative flex-none w-[85vw] md:w-[400px] h-[280px] md:h-[320px] rounded-2xl overflow-hidden snap-center group cursor-pointer"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              {business.image_url ? (
                <Image
                  src={business.image_url}
                  alt={business.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 85vw, 400px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
              )}
            </div>

            {/* Gradient Overlay - CRITICAL for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Verified Badge */}
            {business.is_verified && (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-slate-900">Verified</span>
              </div>
            )}

            {/* Featured Badge (first item) */}
            {index === 0 && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg">
                ⭐ Featured
              </div>
            )}

            {/* Content - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {/* Category */}
              <div className="mb-2">
                <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-sm text-xs font-medium">
                  {business.category}
                </span>
              </div>

              {/* Business Name */}
              <h3 className="text-2xl font-bold mb-2 line-clamp-1 drop-shadow-lg">
                {business.name}
              </h3>

              {/* Rating & Location */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Rating */}
                  {business.rating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{business.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Location */}
                  {business.address && (
                    <div className="flex items-center gap-1.5 text-sm text-white/90">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{business.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {business.description && (
                <p className="mt-2 text-sm text-white/80 line-clamp-2">
                  {business.description}
                </p>
              )}
            </div>

            {/* Hover Effect Border */}
            <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-white/50 transition-all duration-300" />
          </Link>
        ))}
      </div>

      {/* Scroll Indicator */}
      {businesses.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {businesses.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === 0 ? "w-6 bg-slate-900" : "w-1.5 bg-slate-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
