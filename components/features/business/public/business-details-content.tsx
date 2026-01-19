"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Star, Clock, MapPin, Globe, Phone, Bookmark, Navigation, X, Wifi, Car, Utensils, Coffee, ChevronRight, Copy, CreditCard, Ticket } from 'lucide-react'
import { type Business, type MapBusiness } from '@/services/business/business.service'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { HotelBookingDrawer } from '@/components/features/explore/hotel-booking-drawer'
import { ReviewsList } from '@/components/features/business/reviews-list'

interface BusinessDetailsContentProps {
    business: Business
    onClose?: () => void
    isFullPage?: boolean
}

// Map category to emoji
const categoryEmojis: Record<string, string> = {
    'Hotel': '🏨',
    'Hotels': '🏨',
    'Restaurant': '🍽️',
    'Restaurants': '🍽️',
    'Cafe': '☕',
    'Cafes': '☕',
    'Attraction': '🏛️',
    'Attractions': '🏛️',
    'Bar': '🍸',
    'Bars': '🍸',
    'Shopping': '🛍️',
    'Nature': '🌳',
    'Activities': '🎯',
    'Spa': '💆',
    'Museum': '🎨',
    'Museums': '🎨',
}

// Map facility keys to icons and labels
const facilityIcons: Record<string, { icon: any; label: string }> = {
    wifi: { icon: Wifi, label: 'WiFi' },
    parking: { icon: Car, label: 'Parcare' },
    restaurant: { icon: Utensils, label: 'Restaurant' },
    breakfast: { icon: Coffee, label: 'Mic dejun' },
    pool: { icon: null, label: 'Piscină' },
    gym: { icon: null, label: 'Sală fitness' },
    spa: { icon: null, label: 'Spa' },
    ac: { icon: null, label: 'Aer condiționat' },
    pet_friendly: { icon: null, label: 'Pet friendly' },
}

export function BusinessDetailsContent({ business, onClose, isFullPage = false }: BusinessDetailsContentProps) {
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const isHotel = business.category === 'Hotel' || business.category === 'Hotels'

    // Get all images (primary + additional)
    const allImages = [
        business.image_url,
        ...(business.image_urls || [])
    ].filter((url): url is string => !!url && url.trim() !== '')

    const categoryEmoji = categoryEmojis[business.category] || '📍'

    // Get active facilities
    const activeFacilities = business.facilities
        ? Object.entries(business.facilities).filter(([_, isActive]) => isActive).map(([key]) => key)
        : []

    return (
        <div className={cn("space-y-8 pb-32", !isFullPage && "px-6")}>
            {/* Header Section */}
            <div className="flex items-start justify-between mt-2 gap-4">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        {business.name}
                    </h2>
                    {business.tagline && (
                        <p className="text-slate-500 font-medium text-lg">{business.tagline}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-slate-700">{business.rating?.toFixed(1) || 'Nou'}</span>
                        {business.rating && (
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "h-4 w-4",
                                            i < Math.floor(business.rating || 0)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-slate-200 text-slate-200"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                        <span className="text-slate-400 font-medium">{business.price_level}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl mt-3">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                            <span className="text-sm">{categoryEmoji}</span> {business.category}
                        </span>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-colors flex-shrink-0"
                    >
                        <X className="h-6 w-6 stroke-[2.5]" />
                    </button>
                )}
            </div>

            {/* Hero Image or Image Gallery */}
            {allImages.length > 0 ? (
                <div className="space-y-3">
                    {/* Main Image */}
                    <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-[32px] overflow-hidden shadow-sm">
                        <Image
                            src={allImages[0]}
                            alt={business.name}
                            fill
                            priority
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                        />
                    </div>
                    {/* Additional Images Grid */}
                    {allImages.length > 1 && (
                        <div className="grid grid-cols-3 gap-2">
                            {allImages.slice(1, 4).map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                                    <Image
                                        src={url}
                                        alt={`${business.name} ${index + 2}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 33vw, 200px"
                                    />
                                    {index === 2 && allImages.length > 4 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">+{allImages.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative w-full aspect-[16/10] rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-6xl">{categoryEmoji}</span>
                </div>
            )}

            {/* Description Section */}
            {business.description && (
                <div className="space-y-3">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Despre acest loc</h3>
                    <p className="text-slate-500 leading-relaxed font-medium text-lg whitespace-pre-line">
                        {business.description.split(/(https?:\/\/[^\s]+)/g).map((part, i) => (
                            part.match(/https?:\/\/[^\s]+/) ? (
                                <a
                                    key={i}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline break-all"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {part}
                                </a>
                            ) : (
                                part
                            )
                        ))}
                    </p>
                </div>
            )}

            {/* Facilities Section */}
            {activeFacilities.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Facilități</h3>
                    <div className="flex flex-wrap gap-2">
                        {activeFacilities.map((facility) => {
                            const facilityInfo = facilityIcons[facility] || { icon: null, label: facility }
                            const Icon = facilityInfo.icon
                            return (
                                <div
                                    key={facility}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full"
                                >
                                    {Icon && <Icon className="h-4 w-4 text-slate-600" />}
                                    <span className="text-sm font-semibold text-slate-700">{facilityInfo.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Amenities for hotels */}
            {business.amenities && business.amenities.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Dotări</h3>
                    <div className="flex flex-wrap gap-2">
                        {business.amenities.map((amenity) => (
                            <div
                                key={amenity}
                                className="px-4 py-2 bg-blue-50 rounded-full"
                            >
                                <span className="text-sm font-semibold text-blue-700">{amenity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info List */}
            <div className="space-y-1">
                {/* Opening Hours */}
                {business.opening_hours && (
                    <InfoItem
                        icon={Clock}
                        label={
                            <span className="font-bold text-slate-600 text-lg">
                                {business.opening_hours.type === 'non_stop' ? (
                                    <span className="text-green-600">Deschis 24/7</span>
                                ) : (
                                    'Vezi programul'
                                )}
                            </span>
                        }
                        showChevron
                    />
                )}

                {/* Address */}
                {business.address && (
                    <InfoItem
                        icon={MapPin}
                        label={<span className="font-bold text-slate-600 text-lg">{business.address}</span>}
                        showCopy
                        copyText={business.address}
                    />
                )}

                {/* Website */}
                {business.website && (
                    <InfoItem
                        icon={Globe}
                        label={<span className="font-bold text-blue-500 text-lg">{business.website}</span>}
                        onClick={() => window.open(business.website!, '_blank')}
                        showChevron
                    />
                )}

                {/* Phone */}
                {business.phone && (
                    <InfoItem
                        icon={Phone}
                        label={<span className="font-bold text-slate-600 text-lg">{business.phone}</span>}
                        onClick={() => window.open(`tel:${business.phone}`, '_self')}
                        showChevron
                    />
                )}
            </div>

            {/* Reviews Section */}
            <div className="pt-4 border-t border-slate-100">
                <ReviewsList businessId={business.id} />
            </div>

            {/* Footer Buttons */}
            <div className={cn(
                "fixed bottom-10 left-0 right-0 px-6 pointer-events-none z-50",
                isFullPage && "max-w-4xl mx-auto"
            )}>
                <div className="flex items-center justify-center gap-4 pointer-events-auto">
                    {/* Ticket Button (if available) */}
                    {business.ticket_url && !isHotel && (
                        <button
                            onClick={() => window.open(business.ticket_url!, '_blank')}
                            className="flex-1 flex items-center justify-center gap-3 px-6 pt-4 pb-4.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-[0_20px_50px_rgba(16,185,129,0.3)] border border-transparent hover:scale-105 transition-all active:scale-95 group"
                        >
                            <Ticket className="h-6 w-6 text-white stroke-[2.5]" />
                            <span className="font-black text-white text-lg tracking-tight">Bilete</span>
                        </button>
                    )}

                    {/* Main Action Action */}
                    {isHotel ? (
                        <button
                            onClick={() => setIsBookingOpen(true)}
                            className="flex-1 flex items-center justify-center gap-3 px-6 pt-4 pb-4.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-[0_20px_50px_rgba(37,99,235,0.3)] border border-transparent hover:scale-105 transition-all active:scale-95 group"
                        >
                            <CreditCard className="h-6 w-6 text-white stroke-[2.5]" />
                            <span className="font-black text-white text-lg tracking-tight">Rezervă</span>
                        </button>
                    ) : (
                        <button
                            onClick={async () => {
                                try {
                                    const supabase = await import('@/lib/supabase/client').then(mod => mod.createClient())
                                    const { data: { user } } = await supabase.auth.getUser()

                                    if (!user) {
                                        toast.error('Trebuie să fii autentificat pentru a salva!')
                                        return
                                    }

                                    const { saveBusinessForUser } = await import('@/services/auth/profile.service')
                                    await saveBusinessForUser(user.id, business.id)

                                    toast.success('Adăugat la favorite!', {
                                        description: 'Locația a fost salvată în lista ta.'
                                    })
                                } catch (error) {
                                    console.error('Save error:', error)
                                    toast.error('Eroare la salvare', {
                                        description: 'Locația este deja salvată sau a apărut o eroare.'
                                    })
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-3 px-8 pt-4 pb-4.5 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 hover:scale-105 transition-all active:scale-95 group"
                        >
                            <Bookmark className="h-6 w-6 text-slate-900 group-hover:fill-slate-900 stroke-[2.5]" />
                            <span className="font-black text-slate-900 text-lg tracking-tight">Salvează</span>
                        </button>
                    )}

                    {/* Navigation Button */}
                    <button
                        onClick={() => {
                            const address = business.address || business.name;
                            const query = encodeURIComponent(address);
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
                        }}
                        className="flex-shrink-0 h-14 w-14 flex items-center justify-center bg-slate-900 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-900 hover:scale-105 transition-all active:scale-95 group"
                    >
                        <Navigation className="h-6 w-6 text-white group-hover:fill-white stroke-[2.5]" />
                    </button>
                </div>
            </div>

            {/* Booking Drawer for Hotels */}
            {isHotel && (
                <HotelBookingDrawer
                    business={business as MapBusiness}
                    isOpen={isBookingOpen}
                    onClose={() => setIsBookingOpen(false)}
                    onBooked={() => {
                        setIsBookingOpen(false)
                        toast.success('Rezervare confirmată! 🎉')
                    }}
                />
            )}
        </div>
    )
}

interface InfoItemProps {
    icon: any
    label: React.ReactNode
    showChevron?: boolean
    showCopy?: boolean
    copyText?: string
    onClick?: () => void
}

function InfoItem({ icon: Icon, label, showChevron, showCopy, copyText, onClick }: InfoItemProps) {
    return (
        <div
            className={cn(
                "flex items-center mt-2 group p-4 -mx-4 rounded-[28px] transition-colors",
                (onClick || showChevron) && "cursor-pointer hover:bg-slate-50"
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-5 flex-1">
                <Icon className="h-7 w-7 text-slate-300 group-hover:text-slate-900 transition-colors stroke-[2]" />
                <div className="text-slate-900 leading-tight">{label}</div>
            </div>
            {showChevron && <ChevronRight className="h-6 w-6 text-slate-300" />}
            {showCopy && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        if (copyText) {
                            navigator.clipboard.writeText(copyText)
                            toast.success('Copiat în clipboard!')
                        }
                    }}
                    className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"
                >
                    <Copy className="h-6 w-6 text-slate-300" />
                </button>
            )}
        </div>
    )
}
