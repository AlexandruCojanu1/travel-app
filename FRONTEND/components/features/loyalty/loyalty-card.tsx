"use client"

import { useState, useEffect } from 'react'
import { Star, Gift, TrendingUp, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface LoyaltyData {
  points: number
  tier: string
  lifetime_points: number
}

export function LoyaltyCard() {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLoyalty()
  }, [])

  async function loadLoyalty() {
    try {
      const response = await fetch('/api/loyalty/points', {
        credentials: 'include',
      })
      const result = await response.json()

      if (result.success) {
        setLoyalty(result.loyalty)
      }
    } catch (error) {
      console.error('Error loading loyalty:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
        <p>Loading...</p>
      </div>
    )
  }

  if (!loyalty) {
    return null
  }

  const tierColors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-600',
  }

  const tierIcons = {
    bronze: Award,
    silver: Star,
    gold: Gift,
    platinum: TrendingUp,
  }

  const Icon = tierIcons[loyalty.tier as keyof typeof tierIcons] || Award
  const nextTierPoints = {
    bronze: 2000,
    silver: 5000,
    gold: 10000,
    platinum: Infinity,
  }

  const currentTierMax = nextTierPoints[loyalty.tier as keyof typeof nextTierPoints] || Infinity
  const progress = currentTierMax === Infinity 
    ? 100 
    : (loyalty.lifetime_points / currentTierMax) * 100

  return (
    <div className={cn(
      "bg-gradient-to-br rounded-xl p-6 text-white shadow-lg",
      tierColors[loyalty.tier as keyof typeof tierColors] || tierColors.bronze
    )}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Loyalty Points</h3>
          <p className="text-sm opacity-90 capitalize">{loyalty.tier} Member</p>
        </div>
        <Icon className="h-8 w-8" />
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold">{loyalty.points.toLocaleString()}</span>
          <span className="text-sm opacity-90">points</span>
        </div>
        <div className="text-sm opacity-90">
          {loyalty.lifetime_points.toLocaleString()} lifetime points
        </div>
      </div>

      {currentTierMax !== Infinity && (
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Progress to {loyalty.tier === 'bronze' ? 'Silver' : loyalty.tier === 'silver' ? 'Gold' : 'Platinum'}</span>
            <span>{Math.min(progress, 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

