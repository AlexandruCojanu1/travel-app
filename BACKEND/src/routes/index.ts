import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { bookingRouter } from './booking.routes.js'
import { businessRouter } from './business.routes.js'
import { paymentRouter } from './payment.routes.js'
import { tripRouter } from './trip.routes.js'
import { reviewRouter } from './review.routes.js'
import { weatherRouter } from './weather.routes.js'
import { adminRouter } from './admin.routes.js'
import { webhookRouter } from './webhook.routes.js'
import { gamificationRouter } from './gamification.routes.js'

export const router = Router()

// Mount route modules
router.use('/auth', authRouter)
router.use('/bookings', bookingRouter)
router.use('/businesses', businessRouter)
router.use('/payments', paymentRouter)
router.use('/trips', tripRouter)
router.use('/reviews', reviewRouter)
router.use('/weather', weatherRouter)
router.use('/admin', adminRouter)
router.use('/webhooks', webhookRouter)
router.use('/gamification', gamificationRouter)

// Catch-all for unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})
