"use client"

import Image from 'next/image'

interface HeroParallaxProps {
  business: {
    name?: string
    image_url?: string | null
  }
}

export function HeroParallax({ business }: HeroParallaxProps) {
  const imageUrl = business?.image_url

  return (
    <div className="relative h-64 md:h-80 w-full overflow-hidden">
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={business?.name || "Business"}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />
      )}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full px-6 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {business?.name || "Business"}
          </h1>
        </div>
      </div>
    </div>
  )
}


