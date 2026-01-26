import Stripe from 'stripe'

/**
 * Stripe client initialization
 * Conditionally initializes Stripe only if STRIPE_SECRET_KEY is set
 * This allows the app to build even if Stripe keys are not fully configured
 */
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  })

  return stripeInstance
}

// Export for backward compatibility, but it will throw if used without key
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})
