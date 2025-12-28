"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/shared/ui/button'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

// Initialize Stripe with publishable key
const getStripePublishableKey = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  }
  return ''
}

const stripeKey = getStripePublishableKey()
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

interface StripeWrapperProps {
  bookingId: string
  amount: number
}

function PaymentForm({ bookingId, amount }: StripeWrapperProps) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoadingSecret, setIsLoadingSecret] = useState(true)

  // Load payment intent on mount
  useEffect(() => {
    async function loadPaymentIntent() {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ bookingId }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error || 'Failed to initialize payment')
          setIsLoadingSecret(false)
          return
        }

        setClientSecret(result.clientSecret)
      } catch (err: any) {
        console.error('Error loading payment intent:', err)
        setError(err.message || 'Failed to initialize payment')
      } finally {
        setIsLoadingSecret(false)
      }
    }

    if (bookingId) {
      loadPaymentIntent()
    }
  }, [bookingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment form validation failed')
        setIsProcessing(false)
        return
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/bookings?success=true`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        setIsProcessing(false)
      } else {
        // Payment succeeded
        toast.success('Payment successful!')
        router.push('/bookings?success=true')
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'An unexpected error occurred')
      setIsProcessing(false)
    }
  }

  if (isLoadingSecret) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error && !clientSecret) {
    return (
      <div className="p-6 bg-white rounded-xl border border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Payment Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Details</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-blue-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <PaymentElement />
        </div>

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Pay {amount.toFixed(2)} RON
            </>
          )}
        </Button>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Your payment is secure and encrypted
        </p>
      </div>
    </form>
  )
}

export function StripeWrapper({ bookingId, amount }: StripeWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPaymentIntent() {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ bookingId }),
        })

        const result = await response.json()

        if (result.success && result.clientSecret) {
          setClientSecret(result.clientSecret)
        }
      } catch (err) {
        console.error('Error loading payment intent:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (bookingId) {
      loadPaymentIntent()
    }
  }, [bookingId])

  if (isLoading || !clientSecret) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  }

  if (!stripePromise) {
    return (
      <div className="p-6 bg-white rounded-xl border border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Payment System Not Configured</h3>
            <p className="text-sm text-red-600">
              Stripe publishable key is missing. Please configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm bookingId={bookingId} amount={amount} />
    </Elements>
  )
}
