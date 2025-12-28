"use client"

interface ReviewsSectionProps {
  businessId?: string
  reviews?: any[]
  averageRating?: number | null
}

export function ReviewsSection({ businessId, reviews, averageRating }: ReviewsSectionProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-airbnb-dark mb-4">Reviews</h2>
      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-5 airbnb-card">
              <p className="text-airbnb-dark">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-airbnb-gray">No reviews yet</p>
      )}
    </div>
  )
}

