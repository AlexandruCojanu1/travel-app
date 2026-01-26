import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validation.middleware.js'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { createError } from '../middleware/error.middleware.js'

export const bookingRouter = Router()

// Schemas
const createBookingSchema = z.object({
  business_id: z.string().uuid(),
  room_id: z.string().uuid(),
  trip_id: z.string().uuid().optional(),
  check_in: z.string(),
  check_out: z.string(),
  guests: z.number().int().positive(),
  rooms_count: z.number().int().positive().optional().default(1),
  payment_option: z.enum(['full', 'deposit', 'on_site']).optional().default('full'),
  guest_name: z.string().optional(),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().optional(),
  special_requests: z.string().optional(),
  cancellation_policy: z.enum(['flexible', 'moderate', 'strict']).optional().default('flexible'),
})

// Create booking
bookingRouter.post('/', authMiddleware, validateBody(createBookingSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id
    const bookingData = req.body

    // Calculate price
    const { data: room, error: roomError } = await supabaseAdmin
      .from('hotel_rooms')
      .select('price_per_night')
      .eq('id', bookingData.room_id)
      .single()

    if (roomError || !room) {
      throw createError('Room not found', 404)
    }

    const checkIn = new Date(bookingData.check_in)
    const checkOut = new Date(bookingData.check_out)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const subtotal = room.price_per_night * nights * bookingData.rooms_count
    const taxes = subtotal * 0.09
    const totalPrice = subtotal + taxes

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: userId,
        business_id: bookingData.business_id,
        room_id: bookingData.room_id,
        trip_id: bookingData.trip_id,
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        guests: bookingData.guests,
        rooms_count: bookingData.rooms_count,
        total_price: totalPrice,
        payment_option: bookingData.payment_option,
        guest_name: bookingData.guest_name,
        guest_email: bookingData.guest_email,
        guest_phone: bookingData.guest_phone,
        special_requests: bookingData.special_requests,
        cancellation_policy: bookingData.cancellation_policy,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      throw createError(`Failed to create booking: ${error.message}`, 500)
    }

    res.status(201).json(booking)
  } catch (error) {
    next(error)
  }
})

// Get user's bookings
bookingRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*, businesses(name, image_url), hotel_rooms(name, room_type)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError(`Failed to fetch bookings: ${error.message}`, 500)
    }

    res.json(bookings)
  } catch (error) {
    next(error)
  }
})

// Get single booking
bookingRouter.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, businesses(name, image_url, address), hotel_rooms(name, room_type, amenities)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !booking) {
      throw createError('Booking not found', 404)
    }

    res.json(booking)
  } catch (error) {
    next(error)
  }
})

// Cancel booking
bookingRouter.post('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { reason } = req.body

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw createError(`Failed to cancel booking: ${error.message}`, 500)
    }

    res.json(booking)
  } catch (error) {
    next(error)
  }
})

// Confirm booking (for business owners)
bookingRouter.post('/:id/confirm', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw createError(`Failed to confirm booking: ${error.message}`, 500)
    }

    res.json(booking)
  } catch (error) {
    next(error)
  }
})

// Calculate booking price
bookingRouter.post('/calculate-price', async (req, res, next) => {
  try {
    const { room_id, check_in, check_out, rooms_count = 1 } = req.body

    const { data: room, error } = await supabaseAdmin
      .from('hotel_rooms')
      .select('price_per_night')
      .eq('id', room_id)
      .single()

    if (error || !room) {
      throw createError('Room not found', 404)
    }

    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const subtotal = room.price_per_night * nights * rooms_count
    const taxes = subtotal * 0.09
    const total = subtotal + taxes
    const deposit_amount = total * 0.2

    res.json({
      nights,
      price_per_night: room.price_per_night,
      rooms_count,
      subtotal,
      taxes,
      total,
      deposit_amount,
    })
  } catch (error) {
    next(error)
  }
})

// Get booking invoice
bookingRouter.get('/invoice', authMiddleware, async (req, res, next) => {
  try {
    const { bookingId } = req.query
    const userId = req.user!.id

    if (!bookingId) {
      throw createError('Booking ID is required', 400)
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, businesses(name, address, phone, email), hotel_rooms(name, room_type)')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single()

    if (error || !booking) {
      throw createError('Booking not found', 404)
    }

    // Return booking data as invoice
    res.json({
      booking,
      invoice: {
        booking_id: booking.id,
        business_name: booking.businesses?.name,
        business_address: booking.businesses?.address,
        business_phone: booking.businesses?.phone,
        business_email: booking.businesses?.email,
        room_name: booking.hotel_rooms?.name,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests: booking.guests,
        total_price: booking.total_price,
        status: booking.status,
        created_at: booking.created_at,
      },
    })
  } catch (error) {
    next(error)
  }
})
