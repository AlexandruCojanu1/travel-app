import { Router } from 'express'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { createError } from '../middleware/error.middleware.js'

export const businessRouter = Router()

// Get businesses list with filters
businessRouter.get('/', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { 
      city_id, 
      category, 
      search,
      lat, 
      lng, 
      radius = 10,
      limit = 50,
      offset = 0,
    } = req.query

    let query = supabaseAdmin
      .from('businesses')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    if (city_id) {
      query = query.eq('city_id', city_id)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Pagination
    query = query
      .range(Number(offset), Number(offset) + Number(limit) - 1)
      .order('rating', { ascending: false })

    const { data: businesses, error, count } = await query

    if (error) {
      throw createError(`Failed to fetch businesses: ${error.message}`, 500)
    }

    res.json({
      businesses: businesses || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error) {
    next(error)
  }
})

// Get single business
businessRouter.get('/:id', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('*, business_images(*), business_amenities(*)')
      .eq('id', id)
      .single()

    if (error || !business) {
      throw createError('Business not found', 404)
    }

    res.json(business)
  } catch (error) {
    next(error)
  }
})

// Get businesses for map (minimal data)
businessRouter.get('/map/markers', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { city_id, category, bounds } = req.query

    let query = supabaseAdmin
      .from('businesses')
      .select('id, name, latitude, longitude, category, rating, price_level, image_url')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (city_id) {
      query = query.eq('city_id', city_id)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: businesses, error } = await query.limit(200)

    if (error) {
      throw createError(`Failed to fetch map markers: ${error.message}`, 500)
    }

    res.json(businesses || [])
  } catch (error) {
    next(error)
  }
})

// Record swipe
businessRouter.post('/:id/swipe', authMiddleware, async (req, res, next) => {
  try {
    const { id: businessId } = req.params
    const { action } = req.body // 'like' or 'pass'
    const userId = req.user!.id

    const { error } = await supabaseAdmin
      .from('user_swipes')
      .upsert({
        user_id: userId,
        business_id: businessId,
        action,
        swiped_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,business_id'
      })

    if (error) {
      throw createError(`Failed to record swipe: ${error.message}`, 500)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Save/unsave business
businessRouter.post('/:id/save', authMiddleware, async (req, res, next) => {
  try {
    const { id: businessId } = req.params
    const userId = req.user!.id

    const { error } = await supabaseAdmin
      .from('saved_businesses')
      .upsert({
        user_id: userId,
        business_id: businessId,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,business_id'
      })

    if (error) {
      throw createError(`Failed to save business: ${error.message}`, 500)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

businessRouter.delete('/:id/save', authMiddleware, async (req, res, next) => {
  try {
    const { id: businessId } = req.params
    const userId = req.user!.id

    const { error } = await supabaseAdmin
      .from('saved_businesses')
      .delete()
      .eq('user_id', userId)
      .eq('business_id', businessId)

    if (error) {
      throw createError(`Failed to unsave business: ${error.message}`, 500)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Get user's saved businesses
businessRouter.get('/user/saved', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('saved_businesses')
      .select('*, businesses(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError(`Failed to fetch saved businesses: ${error.message}`, 500)
    }

    res.json(data || [])
  } catch (error) {
    next(error)
  }
})

// Get businesses owned by the authenticated user (for business portal)
businessRouter.get('/user/owned', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id

    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('*, business_images(*), business_amenities(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError(`Failed to fetch user businesses: ${error.message}`, 500)
    }

    res.json({
      success: true,
      businesses: businesses || [],
      total: businesses?.length || 0,
    })
  } catch (error) {
    next(error)
  }
})

// Create a new business
businessRouter.post('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id
    const businessData = req.body.data || req.body

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .insert({
        ...businessData,
        owner_id: userId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw createError(`Failed to create business: ${error.message}`, 500)
    }

    res.status(201).json({
      success: true,
      business,
    })
  } catch (error) {
    next(error)
  }
})
