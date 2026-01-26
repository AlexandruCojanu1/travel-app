"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Loader2, MapPin, Star, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getSavedBusinesses, unsaveBusinessForUser } from "@/services/auth/profile.service"
import { toast } from "sonner"
import { Button } from "@/components/shared/ui/button"

export default function SavedPage() {
    const router = useRouter()
    const [savedItems, setSavedItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadSavedItems()
    }, [])

    async function loadSavedItems() {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const items = await getSavedBusinesses(user.id)
            setSavedItems(items)
        } catch (error) {
            console.error('Error loading saved items:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUnsave = async (businessId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await unsaveBusinessForUser(user.id, businessId)
            setSavedItems(prev => prev.filter(item => item.business_id !== businessId))
            toast.success('Locație ștearsă din favorite')
        } catch (error) {
            toast.error('Eroare la ștergere')
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Se încarcă lista...</p>
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/profile"
                    className="p-2 hover:bg-secondary/20 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-foreground" />
                </Link>
                <h1 className="text-3xl font-bold text-foreground">Favorite</h1>
            </div>

            {savedItems.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                    <div className="h-20 w-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                        <Star className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Nu ai nicio locație salvată</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                        Explorează harta și salvează locurile preferate pentru a le găsi ușor aici.
                    </p>
                    <Button onClick={() => router.push('/explore')} className="bg-primary text-white hover:bg-primary/90">
                        Explorează Harta
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedItems.map((item) => {
                        const business = item.businesses
                        if (!business) return null

                        return (
                            <div
                                key={item.id}
                                className="group relative bg-white rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all cursor-pointer"
                                onClick={() => router.push(`/explore?businessId=${business.id}`)}
                            >
                                <div className="aspect-video relative bg-muted">
                                    {business.image_url ? (
                                        <Image
                                            src={business.image_url}
                                            alt={business.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            No Image
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => handleUnsave(business.id, e)}
                                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white border border-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-xs font-medium text-white">
                                        {business.category}
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-foreground line-clamp-1">{business.name}</h3>
                                        {business.rating && (
                                            <div className="flex items-center gap-1 bg-secondary/20 px-1.5 py-0.5 rounded-md">
                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-bold text-foreground">{business.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {business.address && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="line-clamp-1">{business.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
