"use client"

interface StripeWrapperProps {
  children?: React.ReactNode
  bookingId?: string
  amount?: number
}

export function StripeWrapper({ children, bookingId, amount }: StripeWrapperProps) {
  return (
    <div>
      {children || (
        <div className="p-6 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-600">Stripe payment form - Coming soon</p>
          {bookingId && <p className="text-xs text-slate-400 mt-2">Booking ID: {bookingId}</p>}
          {amount && <p className="text-xs text-slate-400">Amount: {amount}</p>}
        </div>
      )}
    </div>
  )
}

