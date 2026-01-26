import Stripe from 'stripe'
import { logger } from './logger.js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  logger.warn('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16',
  typescript: true,
})

export default stripe
