"use client"

interface BookingSummaryProps {
  booking?: any
  business?: any
  startDate?: string
  endDate?: string
  guests?: number
  totalPrice?: number
  pricePerNight?: number
}

export function BookingSummary({ 
  booking, 
  business, 
  startDate, 
  endDate, 
  guests, 
  totalPrice, 
  pricePerNight 
}: BookingSummaryProps) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Booking Summary</h2>
      {business && (
        <div className="space-y-2">
          <p className="font-semibold text-slate-900">{business.name}</p>
          {startDate && endDate && (
            <p className="text-slate-600">{startDate} - {endDate}</p>
          )}
          {guests && <p className="text-slate-600">{guests} guests</p>}
          {totalPrice && <p className="text-lg font-bold text-slate-900">Total: {totalPrice}</p>}
        </div>
      )}
    </div>
  )
}

