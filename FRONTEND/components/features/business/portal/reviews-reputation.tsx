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
      toast.error('Te rugăm să introduci un mesaj de răspuns')
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
        toast.error('Funcția de răspuns necesită actualizarea bazei de date. Te rugăm să rulezi scriptul de actualizare.')
      } else {
        toast.error('Nu s-a putut publica răspunsul')
      }
      return
    }

    toast.success('Răspuns publicat cu succes')
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
        <div className="text-mova-gray">Se încarcă recenziile...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-mova-dark">Recenzii și Reputație</h3>
        <p className="text-sm text-mova-gray mt-1">
          Gestionează recenziile, răspunde la feedback și monitorizează-ți reputația
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="airbnb-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-mova-gray">Rating mediu</span>
            <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-mova-dark">
            {averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-mova-gray mt-1">
            Bazat pe {reviews.length} {reviews.length === 1 ? 'recenzie' : 'recenzii'}
          </div>
        </div>
        <div className="airbnb-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-mova-gray">Rata de răspuns</span>
            <Reply className="h-5 w-5 text-mova-blue" />
          </div>
          <div className="text-3xl font-bold text-mova-dark">
            {responseRate.toFixed(0)}%
          </div>
          <div className="text-sm text-mova-gray mt-1">
            Ai răspuns la {reviews.filter(r => r.reply_text).length} recenzii
          </div>
        </div>
        <div className="airbnb-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-mova-gray">Total recenzii</span>
            <Star className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-mova-dark">
            {reviews.length}
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      {sentimentData.length > 0 && (
        <div className="airbnb-card p-6">
          <h4 className="text-lg font-semibold text-mova-dark mb-4">Analiză sentiment</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" name="Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="airbnb-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-mova-gray" />
            <span className="text-sm font-semibold text-mova-dark">Filtre:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-mova-gray">Rating:</span>
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1.5 rounded-airbnb border border-gray-300 text-sm focus:ring-2 focus:ring-mova-blue focus:border-mova-blue"
            >
              <option value="">Toate</option>
              <option value="5">5 stele</option>
              <option value="4">4 stele</option>
              <option value="3">3 stele</option>
              <option value="2">2 stele</option>
              <option value="1">1 stea</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-mova-gray">Răspuns:</span>
            <select
              value={showRepliedOnly === null ? '' : showRepliedOnly ? 'yes' : 'no'}
              onChange={(e) => {
                if (e.target.value === '') setShowRepliedOnly(null)
                else setShowRepliedOnly(e.target.value === 'yes')
              }}
              className="px-3 py-1.5 rounded-airbnb border border-gray-300 text-sm focus:ring-2 focus:ring-mova-blue focus:border-mova-blue"
            >
              <option value="">Toate</option>
              <option value="yes">Cu răspuns</option>
              <option value="no">Fără răspuns</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-mova-gray">Sortare:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-airbnb border border-gray-300 text-sm focus:ring-2 focus:ring-mova-blue focus:border-mova-blue"
            >
              <option value="newest">Cele mai noi</option>
              <option value="oldest">Cele mai vechi</option>
              <option value="lowest">Rating cel mai mic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-mova-light-gray rounded-airbnb-lg border-2 border-dashed border-gray-300">
            <Star className="h-12 w-12 text-mova-gray mx-auto mb-4" />
            <p className="text-mova-gray">Încă nu există recenzii</p>
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
                    <span className="font-semibold text-mova-dark">
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
                  <div className="text-sm text-mova-gray">
                    {format(new Date(review.created_at), 'MMMM dd, yyyy')}
                  </div>
                </div>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <div className="mb-4">
                  <p className="text-mova-dark">{review.comment}</p>
                </div>
              )}

              {/* Reply Section */}
              {review.reply_text ? (
                <div className="mt-4 p-4 bg-mova-light-blue rounded-airbnb border border-mova-blue/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Reply className="h-4 w-4 text-mova-blue" />
                    <span className="text-sm font-semibold text-mova-dark">Răspunsul tău</span>
                    {review.reply_date && (
                      <span className="text-xs text-mova-gray">
                        {format(new Date(review.reply_date), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-mova-dark">{review.reply_text}</p>
                </div>
              ) : (
                <div className="mt-4">
                  {replyingTo === review.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Scrie răspunsul tău..."
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3 rounded-airbnb-lg border-2 border-gray-300 focus:border-mova-blue focus:ring-2 focus:ring-mova-blue/20 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-mova-gray">
                          {replyText.length}/500 caractere
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
                            Anulează
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReply(review.id)}
                            disabled={!replyText.trim()}
                          >
                            Publică răspuns
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
                      Răspunde la recenzie
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

