import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { stripe } from '../lib/stripe.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { createError } from '../middleware/error.middleware.js'

export const paymentRouter = Router()

// Create payment intent
paymentRouter.post('/intent', authMiddleware, async (req, res, next) => {
  try {
    const { 
      room_id, 
      check_in, 
      check_out, 
      rooms_count = 1,
      payment_option = 'full',
      guests,
      booking_id,
    } = req.body

    const userId = req.user!.id
    const userEmail = req.user!.email

    // Get room price
    const { data: room, error: roomError } = await supabaseAdmin
      .from('hotel_rooms')
      .select('price_per_night, business_id, name')
      .eq('id', room_id)
      .single()

    if (roomError || !room) {
      throw createError('Room not found', 404)
    }

    // Calculate price
    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const subtotal = room.price_per_night * nights * rooms_count
    const taxes = subtotal * 0.09
    const total = subtotal + taxes

    // Determine amount based on payment option
    let amount: number
    switch (payment_option) {
      case 'deposit':
        amount = Math.round(total * 0.2 * 100) // 20% deposit in cents
        break
      case 'full':
      default:
        amount = Math.round(total * 100) // Full amount in cents
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'ron',
      metadata: {
        user_id: userId,
        room_id,
        business_id: room.business_id,
        booking_id: booking_id || '',
        check_in,
        check_out,
        rooms_count: String(rooms_count),
        guests: String(guests),
        payment_option,
      },
      receipt_email: userEmail || undefined,
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
    })
  } catch (error) {
    next(error)
  }
})

// Get payment status
paymentRouter.get('/status/:intentId', authMiddleware, async (req, res, next) => {
  try {
    const { intentId } = req.params

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId)

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    })
  } catch (error) {
    next(error)
  }
})
