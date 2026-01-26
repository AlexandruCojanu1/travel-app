import { Router } from 'express'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { createError } from '../middleware/error.middleware.js'

export const reviewRouter = Router()

// Get reviews for a business
reviewRouter.get('/business/:businessId', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { businessId } = req.params
    const { limit = 20, offset = 0 } = req.query

    const { data: reviews, error, count } = await supabaseAdmin
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      throw createError(`Failed to fetch reviews: ${error.message}`, 500)
    }

    res.json({
      reviews: reviews || [],
      total: count || 0,
    })
  } catch (error) {
    next(error)
  }
})

// Create review
reviewRouter.post('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id
    const { business_id, rating, content, images } = req.body

    // Check if user already reviewed this business
    const { data: existing } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', business_id)
      .single()

    if (existing) {
      throw createError('You have already reviewed this business', 400)
    }

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        user_id: userId,
        business_id,
        rating,
        content,
        images: images || [],
      })
      .select('*, profiles(full_name, avatar_url)')
      .single()

    if (error) {
      throw createError(`Failed to create review: ${error.message}`, 500)
    }

    // Update business average rating
    await updateBusinessRating(business_id)

    res.status(201).json(review)
  } catch (error) {
    next(error)
  }
})

// Update review
reviewRouter.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { rating, content, images } = req.body

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .update({
        rating,
        content,
        images,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw createError(`Failed to update review: ${error.message}`, 500)
    }

    // Update business average rating
    if (review) {
      await updateBusinessRating(review.business_id)
    }

    res.json(review)
  } catch (error) {
    next(error)
  }
})

// Delete review
reviewRouter.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // Get business_id before deleting
    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('business_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw createError(`Failed to delete review: ${error.message}`, 500)
    }

    // Update business average rating
    if (review) {
      await updateBusinessRating(review.business_id)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Helper to update business average rating
async function updateBusinessRating(businessId: string) {
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('business_id', businessId)

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

    await supabaseAdmin
      .from('businesses')
      .update({ 
        rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
      })
      .eq('id', businessId)
  }
}
