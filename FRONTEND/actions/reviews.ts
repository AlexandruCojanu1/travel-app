'use server'

import { 
  getBusinessReviews as getBusinessReviewsService,
  createReview as createReviewService,
  type Review,
  type CreateReviewInput
} from '@/services/business/review.service'

// Re-export types for client components
export type { Review, CreateReviewInput }

/**
 * Get reviews for a business
 */
export async function getBusinessReviews(businessId: string): Promise<Review[]> {
  return await getBusinessReviewsService(businessId)
}

/**
 * Create a new review
 */
export async function createReview(params: CreateReviewInput): Promise<{ success: boolean; review?: Review | null; error?: string }> {
  try {
    const review = await createReviewService(params)
    if (!review) {
      return { success: false, error: 'Failed to create review' }
    }
    return { success: true, review }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create review' }
  }
}
