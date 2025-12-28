"use client"

import Image from 'next/image'
import { Calendar, Users, MapPin, Star } from 'lucide-react'
import { format } from 'date-fns'

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
  if (!business) return null

  const nights = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="space-y-6">
      {/* Business Card */}
      <div className="airbnb-card overflow-hidden">
        {business.image_url && (
          <div className="relative w-full h-48">
            <Image
              src={business.image_url}
              alt={business.name}
              fill
              className="object-cover"
              sizes="100%"
            />
          </div>
        )}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-airbnb-dark mb-2">{business.name}</h2>
          {business.rating && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-airbnb-dark">{business.rating.toFixed(1)}</span>
            </div>
          )}
          {business.address && (
            <div className="flex items-start gap-2 text-airbnb-gray">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{business.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details */}
      <div className="airbnb-card p-6">
        <h3 className="text-lg font-bold text-airbnb-dark mb-4">Booking Details</h3>
        
        <div className="space-y-4">
          {startDate && endDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-airbnb-gray flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-airbnb-gray mb-1">Check-in / Check-out</p>
                <p className="font-semibold text-airbnb-dark">
                  {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-airbnb-gray mt-1">
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </p>
              </div>
            </div>
          )}

          {guests && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-airbnb-gray flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-airbnb-gray mb-1">Guests</p>
                <p className="font-semibold text-airbnb-dark">
                  {guests} {guests === 1 ? 'Guest' : 'Guests'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      {totalPrice && pricePerNight && nights > 0 && (
        <div className="airbnb-card p-6">
          <h3 className="text-lg font-bold text-airbnb-dark mb-4">Price Breakdown</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-airbnb-gray">
                {pricePerNight.toFixed(2)} RON × {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
              <span className="font-semibold text-airbnb-dark">
                {(pricePerNight * nights).toFixed(2)} RON
              </span>
            </div>
            
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-lg font-bold text-airbnb-dark">Total</span>
              <span className="text-2xl font-bold text-airbnb-red">
                {totalPrice.toFixed(2)} RON
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

