"use client"

import { useState, useEffect } from "react"
import { Star, Reply, Filter, SortAsc, SortDesc } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reply_text?: string | null
  reply_date?: string | null
  user?: {
    full_name: string
    email: string
  }
}

interface ReviewsReputationProps {
  businessId: string
}

export function ReviewsReputation({ businessId }: ReviewsReputationProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'lowest'>('newest')
  const [showRepliedOnly, setShowRepliedOnly] = useState<boolean | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sentimentData, setSentimentData] = useState<any[]>([])

  useEffect(() => {
    loadReviews()
  }, [businessId, filterRating, sortBy, showRepliedOnly])

  async function loadReviews() {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // First try with join, if it fails, load reviews separately
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)

      if (filterRating) {
        query = query.eq('rating', filterRating)
      }

      const { data: reviewsData, error: reviewsError } = await query.order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error loading reviews:', reviewsError)
        toast.error('Failed to load reviews')
        setReviews([])
        setIsLoading(false)
        return
      }

      // If we have reviews, fetch user profiles separately
      let data = reviewsData || []
      if (data.length > 0) {
        const userIds = [...new Set(data.map((r: any) => r.user_id).filter(Boolean))]
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)

          const profilesMap = new Map(
            (profilesData || []).map((p: any) => [p.id, p])
          )

          // Merge profile data into reviews
          data = data.map((review: any) => ({
            ...review,
            user: profilesMap.get(review.user_id) || { full_name: 'Anonymous', email: null }
          }))
        }
      }

      let filteredReviews = data || []

      // Filter by replied status
      if (showRepliedOnly === true) {
        filteredReviews = filteredReviews.filter(r => r.reply_text)
      } else if (showRepliedOnly === false) {
        filteredReviews = filteredReviews.filter(r => !r.reply_text)
      }

      // Sort
      if (sortBy === 'oldest') {
        filteredReviews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      } else if (sortBy === 'lowest') {
        filteredReviews.sort((a, b) => a.rating - b.rating)
      }

      setReviews(filteredReviews)
      calculateSentiment(filteredReviews)
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  function calculateSentiment(reviewsData: Review[]) {
    // Calculate average ratings for different aspects
    // For now, we'll use the overall rating as a proxy
    const total = reviewsData.length
    if (total === 0) {
      setSentimentData([])
      return
    }

    const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / total

    // Mock sentiment analysis - in production, this would analyze comment text
    setSentimentData([
      { name: 'Cleanliness', value: avgRating },
      { name: 'Service', value: avgRating },
      { name: 'Location', value: avgRating },
      { name: 'Value for Money', value: avgRating },
    ])
  }

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    const supabase = createClient()
    
    // Check if reply_text column exists, if not we'll need to add it
    const { error } = await supabase
      .from('reviews')
      .update({
        reply_text: replyText,
        reply_date: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) {
      console.error('Error replying to review:', error)
      // If column doesn't exist, we'll need to add it via SQL
      if (error.code === '42703') {
        toast.error('Reply feature requires database update. Please run the schema update script.')
      } else {
        toast.error('Failed to post reply')
      }
      return
    }

    toast.success('Reply posted successfully')
    setReplyingTo(null)
    setReplyText("")
    await loadReviews()
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const responseRate = reviews.length > 0
    ? (reviews.filter(r => r.reply_text).length / reviews.length) * 100
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-airbnb-gray">Loading reviews...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-airbnb-dark">Reviews & Reputation</h3>
        <p className="text-sm text-airbnb-gray mt-1">
          Manage reviews, respond to feedback, and monitor your reputation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="airbnb-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-airbnb-gray">Average Rating</span>
            <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-airbnb-dark">
            {averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-airbnb-gray mt-1">
            Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        <div className="airbnb-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-airbnb-gray">Response Rate</span>
            <Reply className="h-5 w-5 text-airbnb-red" />
          </div>
          <div className="text-3xl font-bold text-airbnb-dark">
            {responseRate.toFixed(0)}%
          </div>
          <div className="text-sm text-airbnb-gray mt-1">
            You've replied to {reviews.filter(r => r.reply_text).length} reviews
          </div>
        </div>
        <div className="airbnb-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-airbnb-gray">Total Reviews</span>
            <Star className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-airbnb-dark">
            {reviews.length}
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      {sentimentData.length > 0 && (
        <div className="airbnb-card p-6">
          <h4 className="text-lg font-semibold text-airbnb-dark mb-4">Sentiment Analysis</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="value" fill="#FF5A5F" name="Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="airbnb-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-airbnb-gray" />
            <span className="text-sm font-semibold text-airbnb-dark">Filters:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-airbnb-gray">Rating:</span>
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1.5 rounded-airbnb border border-gray-300 text-sm focus:ring-2 focus:ring-airbnb-red focus:border-airbnb-red"
            >
              <option value="">All</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-airbnb-gray">Replied:</span>
            <select
              value={showRepliedOnly === null ? '' : showRepliedOnly ? 'yes' : 'no'}
              onChange={(e) => {
                if (e.target.value === '') setShowRepliedOnly(null)
                else setShowRepliedOnly(e.target.value === 'yes')
              }}
              className="px-3 py-1.5 rounded-airbnb border border-gray-300 text-sm focus:ring-2 focus:ring-airbnb-red focus:border-airbnb-red"
            >
              <option value="">All</option>
              <option value="yes">With reply</option>
              <option value="no">Without reply</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-airbnb-gray">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-airbnb border border-gray-300 text-sm focus:ring-2 focus:ring-airbnb-red focus:border-airbnb-red"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="lowest">Lowest rating first</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-airbnb-light-gray rounded-airbnb-lg border-2 border-dashed border-gray-300">
            <Star className="h-12 w-12 text-airbnb-gray mx-auto mb-4" />
            <p className="text-airbnb-gray">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="airbnb-card p-6"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-airbnb-dark">
                      {review.user?.full_name || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-airbnb-gray">
                    {format(new Date(review.created_at), 'MMMM dd, yyyy')}
                  </div>
                </div>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <div className="mb-4">
                  <p className="text-airbnb-dark">{review.comment}</p>
                </div>
              )}

              {/* Reply Section */}
              {review.reply_text ? (
                <div className="mt-4 p-4 bg-airbnb-light-red rounded-airbnb border border-airbnb-red/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Reply className="h-4 w-4 text-airbnb-red" />
                    <span className="text-sm font-semibold text-airbnb-dark">Your Reply</span>
                    {review.reply_date && (
                      <span className="text-xs text-airbnb-gray">
                        {format(new Date(review.reply_date), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-airbnb-dark">{review.reply_text}</p>
                </div>
              ) : (
                <div className="mt-4">
                  {replyingTo === review.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 focus:border-airbnb-red focus:ring-2 focus:ring-airbnb-red/20 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-airbnb-gray">
                          {replyText.length}/500 characters
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyText("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReply(review.id)}
                            disabled={!replyText.trim()}
                          >
                            Post Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyingTo(review.id)}
                      className="flex items-center gap-2"
                    >
                      <Reply className="h-4 w-4" />
                      Reply to Review
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

