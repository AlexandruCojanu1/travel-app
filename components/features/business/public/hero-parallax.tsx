"use client"

interface HeroParallaxProps {
  business: any
}

export function HeroParallax({ business }: HeroParallaxProps) {
  return (
    <div className="h-64 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
      <h1 className="text-3xl font-bold text-white">{business?.name || "Business"}</h1>
    </div>
  )
}


