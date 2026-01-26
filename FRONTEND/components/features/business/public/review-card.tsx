"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Star, User } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface Review {
  id: string
  user_id: string
  business_id: string
  rating: number
  comment: string | null
  created_at: string
  user_name?: string
  user_avatar?: string
}

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formattedDate = format(new Date(review.created_at), 'MMM yyyy')
  const shouldTruncate = review.comment && review.comment.length > 150
  const displayText = shouldTruncate && !isExpanded && review.comment
    ? review.comment.substring(0, 150) + '...'
    : review.comment || ''

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 space-y-4 border border-gray-100">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {review.user_avatar ? (
            <Image
              src={review.user_avatar}
              alt={review.user_name || 'User'}
              width={48}
              height={48}
              className="rounded-full object-cover"
              sizes="48px"
            />
          ) : (
            <User className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Name, Date, Rating */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-900 truncate">
              {review.user_name || 'Anonymous'}
            </p>
            <p className="text-sm text-gray-500 flex-shrink-0">
              {formattedDate}
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <div className="space-y-2">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {displayText}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

