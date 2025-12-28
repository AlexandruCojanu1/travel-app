"use client"

interface ReviewsSectionProps {
  businessId?: string
  reviews?: any[]
  averageRating?: number | null
}

export function ReviewsSection({ businessId, reviews, averageRating }: ReviewsSectionProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Reviews</h2>
      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-900">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-600">No reviews yet</p>
      )}
    </div>
  )
}

