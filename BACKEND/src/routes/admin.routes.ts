import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { createError } from '../middleware/error.middleware.js'

export const adminRouter = Router()

// Admin tables that can be managed
const ALLOWED_TABLES = [
  'businesses', 'cities', 'categories', 'profiles', 'trips', 
  'bookings', 'reviews', 'hotel_rooms', 'events', 'gamification_rules',
  'gamification_quests', 'user_achievements', 'algorithm_settings'
]

// Get data from any table
adminRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { table, page = '1', limit = '25', search, sortBy, sortOrder = 'desc' } = req.query

    if (!table || !ALLOWED_TABLES.includes(table as string)) {
      throw createError(`Table not allowed: ${table}`, 400)
    }

    let query = supabaseAdmin
      .from(table as string)
      .select('*', { count: 'exact' })

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Sorting
    if (sortBy) {
      query = query.order(sortBy as string, { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum
    query = query.range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) {
      throw createError(`Failed to fetch ${table}: ${error.message}`, 500)
    }

    res.json({
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    })
  } catch (error) {
    next(error)
  }
})

// Create record
adminRouter.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { table, data: recordData } = req.body

    if (!table || !ALLOWED_TABLES.includes(table)) {
      throw createError(`Table not allowed: ${table}`, 400)
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert(recordData)
      .select()
      .single()

    if (error) {
      throw createError(`Failed to create record: ${error.message}`, 500)
    }

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

// Update record
adminRouter.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const { table, data: recordData } = req.body

    if (!table || !ALLOWED_TABLES.includes(table)) {
      throw createError(`Table not allowed: ${table}`, 400)
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ ...recordData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw createError(`Failed to update record: ${error.message}`, 500)
    }

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// Delete record
adminRouter.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const { table } = req.query

    if (!table || !ALLOWED_TABLES.includes(table as string)) {
      throw createError(`Table not allowed: ${table}`, 400)
    }

    const { error } = await supabaseAdmin
      .from(table as string)
      .delete()
      .eq('id', id)

    if (error) {
      throw createError(`Failed to delete record: ${error.message}`, 500)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Get algorithm settings
adminRouter.get('/algorithm', authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('algorithm_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw createError(`Failed to fetch algorithm settings: ${error.message}`, 500)
    }

    res.json(data || {
      weights: {
        rating: 0.3,
        price: 0.2,
        distance: 0.2,
        popularity: 0.15,
        recency: 0.15,
      }
    })
  } catch (error) {
    next(error)
  }
})

// Update algorithm settings
adminRouter.put('/algorithm', authMiddleware, async (req, res, next) => {
  try {
    const { weights } = req.body

    const { data, error } = await supabaseAdmin
      .from('algorithm_settings')
      .upsert({
        id: 'default',
        weights,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw createError(`Failed to update algorithm settings: ${error.message}`, 500)
    }

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// Get table schema/columns
adminRouter.get('/tables', authMiddleware, async (req, res, next) => {
  try {
    res.json({ tables: ALLOWED_TABLES })
  } catch (error) {
    next(error)
  }
})
