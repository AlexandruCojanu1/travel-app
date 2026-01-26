import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { createError } from '../middleware/error.middleware.js'
import { v4 as uuidv4 } from 'uuid'

export const tripRouter = Router()

// Get user's trips
tripRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id

    const { data: trips, error } = await supabaseAdmin
      .from('trips')
      .select('*, cities(name)')
      .or(`user_id.eq.${userId},trip_collaborators.user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError(`Failed to fetch trips: ${error.message}`, 500)
    }

    res.json(trips || [])
  } catch (error) {
    next(error)
  }
})

// Get single trip
tripRouter.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: trip, error } = await supabaseAdmin
      .from('trips')
      .select('*, cities(name), trip_items(*, businesses(*))')
      .eq('id', id)
      .single()

    if (error || !trip) {
      throw createError('Trip not found', 404)
    }

    res.json(trip)
  } catch (error) {
    next(error)
  }
})

// Create trip
tripRouter.post('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id
    const { title, city_id, start_date, end_date, budget, preferences } = req.body

    const { data: trip, error } = await supabaseAdmin
      .from('trips')
      .insert({
        user_id: userId,
        title,
        city_id,
        start_date,
        end_date,
        budget,
        preferences,
        status: 'planning',
      })
      .select()
      .single()

    if (error) {
      throw createError(`Failed to create trip: ${error.message}`, 500)
    }

    res.status(201).json(trip)
  } catch (error) {
    next(error)
  }
})

// Update trip
tripRouter.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: trip, error } = await supabaseAdmin
      .from('trips')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw createError(`Failed to update trip: ${error.message}`, 500)
    }

    res.json(trip)
  } catch (error) {
    next(error)
  }
})

// Delete trip
tripRouter.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const { error } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw createError(`Failed to delete trip: ${error.message}`, 500)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Add business to trip
tripRouter.post('/:id/businesses', authMiddleware, async (req, res, next) => {
  try {
    const { id: tripId } = req.params
    const { business_id, day_index = 0 } = req.body

    const { data: item, error } = await supabaseAdmin
      .from('trip_items')
      .insert({
        trip_id: tripId,
        business_id,
        day_index,
        order_index: 0,
      })
      .select()
      .single()

    if (error) {
      throw createError(`Failed to add business to trip: ${error.message}`, 500)
    }

    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

// Remove business from trip
tripRouter.delete('/:tripId/businesses/:businessId', authMiddleware, async (req, res, next) => {
  try {
    const { tripId, businessId } = req.params

    const { error } = await supabaseAdmin
      .from('trip_items')
      .delete()
      .eq('trip_id', tripId)
      .eq('business_id', businessId)

    if (error) {
      throw createError(`Failed to remove business from trip: ${error.message}`, 500)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Generate invite link
tripRouter.post('/:id/invite', authMiddleware, async (req, res, next) => {
  try {
    const { id: tripId } = req.params
    const token = uuidv4()

    const { error } = await supabaseAdmin
      .from('trip_invites')
      .insert({
        trip_id: tripId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })

    if (error) {
      throw createError(`Failed to create invite: ${error.message}`, 500)
    }

    res.json({ 
      token,
      invite_url: `${process.env.FRONTEND_URL}/join/${token}`,
    })
  } catch (error) {
    next(error)
  }
})

// Join trip via invite
tripRouter.post('/join/:token', authMiddleware, async (req, res, next) => {
  try {
    const { token } = req.params
    const userId = req.user!.id

    // Find invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('trip_invites')
      .select('trip_id, expires_at')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      throw createError('Invalid or expired invite', 404)
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw createError('Invite has expired', 400)
    }

    // Add user as collaborator
    const { error } = await supabaseAdmin
      .from('trip_collaborators')
      .insert({
        trip_id: invite.trip_id,
        user_id: userId,
        role: 'member',
      })

    if (error && !error.message.includes('duplicate')) {
      throw createError(`Failed to join trip: ${error.message}`, 500)
    }

    res.json({ success: true, trip_id: invite.trip_id })
  } catch (error) {
    next(error)
  }
})

// Vote for business
tripRouter.post('/:tripId/vote', authMiddleware, async (req, res, next) => {
  try {
    const { tripId } = req.params
    const { business_id, vote } = req.body // vote: 'up' or 'down'
    const userId = req.user!.id

    const { error } = await supabaseAdmin
      .from('trip_votes')
      .upsert({
        trip_id: tripId,
        user_id: userId,
        business_id,
        vote,
        voted_at: new Date().toISOString(),
      }, {
        onConflict: 'trip_id,user_id,business_id'
      })

    if (error) {
      throw createError(`Failed to record vote: ${error.message}`, 500)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Share trip (generate public share link)
tripRouter.post('/share', authMiddleware, async (req, res, next) => {
  try {
    const { trip_id, is_public, access_level } = req.body
    const userId = req.user!.id

    // Verify user owns the trip
    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('id')
      .eq('id', trip_id)
      .eq('user_id', userId)
      .single()

    if (!trip) {
      throw createError('Trip not found or access denied', 404)
    }

    // Generate share token
    const shareToken = uuidv4()
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/plan/${trip_id}?share=${shareToken}`

    // Store share settings (if you have a trips_shares table)
    // For now, just return the share URL
    res.json({
      success: true,
      shareUrl,
      token: shareToken,
    })
  } catch (error) {
    next(error)
  }
})

// Add collaborator to trip
tripRouter.post('/collaborate', authMiddleware, async (req, res, next) => {
  try {
    const { trip_id, user_email, role = 'member' } = req.body
    const userId = req.user!.id

    // Verify user owns the trip
    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('id')
      .eq('id', trip_id)
      .eq('user_id', userId)
      .single()

    if (!trip) {
      throw createError('Trip not found or access denied', 404)
    }

    // Find user by email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    const collaboratorUser = users.find(u => u.email === user_email)

    if (!collaboratorUser) {
      throw createError('User not found with this email', 404)
    }

    // Add as collaborator
    const { error } = await supabaseAdmin
      .from('trip_collaborators')
      .insert({
        trip_id,
        user_id: collaboratorUser.id,
        role,
      })

    if (error && !error.message.includes('duplicate')) {
      throw createError(`Failed to add collaborator: ${error.message}`, 500)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})
