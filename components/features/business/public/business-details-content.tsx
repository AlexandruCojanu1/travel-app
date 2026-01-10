"use client"

import React from 'react'
import Image from 'next/image'
import { Star, Clock, MapPin, Globe, Phone, Bookmark, Navigation, X, Loader2, Lightbulb, ChevronRight, Copy } from 'lucide-react'
import { type Business } from '@/services/business/business.service'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BusinessDetailsContentProps {
    business: Business
    onClose?: () => void
    isFullPage?: boolean
}

export function BusinessDetailsContent({ business, onClose, isFullPage = false }: BusinessDetailsContentProps) {
    return (
        <div className={cn("space-y-8 pb-32", !isFullPage && "px-6")}>
            {/* Header Section */}
            <div className="flex items-start justify-between mt-2 gap-4">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        {business.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-slate-700">{business.rating?.toFixed(1) || '4.7'}</span>
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "h-4 w-4",
                                        i < Math.floor(business.rating || 4.7)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-slate-200 text-slate-200"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-slate-400 font-medium">(358.448)</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl mt-3">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                            <span className="text-sm">🏛️</span> Attractions
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

            {/* Hero Image */}
            <div className="relative w-full aspect-[16/10] md:aspect-[21/9] lg:aspect-[3/1] rounded-[48px] overflow-hidden shadow-sm lg:max-h-[400px]">
                <Image
                    src={business.image_url || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80'}
                    alt={business.name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                />
            </div>

            {/* Description Section */}
            <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">About this place</h3>
                <p className="text-slate-400 leading-relaxed font-semibold text-lg">
                    {business.description || 'Former historic palace housing huge art collection, from Roman sculptures to da Vinci\'s "Mona Lisa."'}
                </p>
            </div>

            {/* Community Notes */}
            <div className="bg-[#FFF8E1] rounded-[40px] overflow-hidden border border-[#FFE082]/30">
                <div className="flex items-center gap-3 p-6 pb-4 bg-[#FFF8D1]/50">
                    <div className="bg-white p-2 rounded-2xl shadow-sm">
                        <Lightbulb className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg">Community Notes</h4>
                </div>
                <div className="px-8 pb-8 pt-2 space-y-6">
                    <ul className="space-y-4">
                        <li className="flex gap-4 text-slate-700 font-bold text-lg leading-snug">
                            <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-900 flex-shrink-0" />
                            The {business.name} is a must-see, but it\'s impossible to see everything in a day.
                        </li>
                        <li className="flex gap-4 text-slate-700 font-bold text-lg leading-snug">
                            <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-900 flex-shrink-0" />
                            The Mona Lisa must be seen while visiting The {business.name}.
                        </li>
                    </ul>
                    <button className="flex items-center justify-between w-full text-slate-400 font-bold text-lg pt-4 border-t border-slate-200/50 hover:text-slate-600 transition-colors">
                        Show sources
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Info List */}
            <div className="space-y-1">
                <InfoItem
                    icon={Clock}
                    label={
                        <span className="font-bold flex items-center gap-2 text-lg">
                            <span className="text-red-500">Closed</span>
                            <span className="text-slate-400 font-medium tracking-tight">• Opens tomorrow at 9 AM</span>
                        </span>
                    }
                    showChevron
                />
                <InfoItem
                    icon={MapPin}
                    label={<span className="font-bold text-slate-600 text-lg">{business.address || '75001 Paris, France'}</span>}
                    showCopy
                />
                <InfoItem
                    icon={Globe}
                    label={<span className="font-bold text-slate-400 text-lg">https://www.{business.name.toLowerCase().replace(/\s/g, '')}.fr/</span>}
                    showChevron
                />
                <InfoItem
                    icon={Phone}
                    label={<span className="font-bold text-slate-400 text-lg">+33 1 40 20 53 17</span>}
                    showChevron
                />
            </div>

            {/* Footer Buttons */}
            <div className={cn(
                "fixed bottom-10 left-0 right-0 px-6 pointer-events-none z-50",
                isFullPage && "max-w-4xl mx-auto"
            )}>
                <div className="flex items-center justify-center gap-4 pointer-events-auto">
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
                        className="flex items-center gap-3 px-8 pt-4 pb-4.5 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 hover:scale-105 transition-all active:scale-95 group"
                    >
                        <Bookmark className="h-6 w-6 text-slate-900 group-hover:fill-slate-900 stroke-[2.5]" />
                        <span className="font-black text-slate-900 text-lg tracking-tight">Salvează</span>
                    </button>
                    <button
                        onClick={() => {
                            // Open Google Maps Directions
                            const address = business.address || business.name;
                            const query = encodeURIComponent(address);
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
                        }}
                        className="flex items-center gap-3 px-8 pt-4 pb-4.5 bg-slate-900 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-900 hover:scale-105 transition-all active:scale-95 group"
                    >
                        <Navigation className="h-6 w-6 text-white group-hover:fill-white stroke-[2.5]" />
                        <span className="font-black text-white text-lg tracking-tight">Indicații</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function InfoItem({ icon: Icon, label, showChevron, showCopy }: { icon: any, label: React.ReactNode, showChevron?: boolean, showCopy?: boolean }) {
    return (
        <div className="flex items-center mt-2 group cursor-pointer hover:bg-slate-50 p-4 -mx-4 rounded-[28px] transition-colors">
            <div className="flex items-center gap-5 flex-1">
                <Icon className="h-7 w-7 text-slate-300 group-hover:text-slate-900 transition-colors stroke-[2]" />
                <div className="text-slate-900 leading-tight">{label}</div>
            </div>
            {showChevron && <ChevronRight className="h-6 w-6 text-slate-300" />}
            {showCopy && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        toast.success('Adresă copiată!')
                    }}
                    className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"
                >
                    <Copy className="h-6 w-6 text-slate-300" />
                </button>
            )}
        </div>
    )
}
