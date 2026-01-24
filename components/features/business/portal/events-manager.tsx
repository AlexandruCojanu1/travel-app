'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { Loader2, Plus, Calendar, ExternalLink, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { scrapeAndSaveEvent } from '@/actions/business/scrape-event'
import Image from 'next/image'

interface EventsManagerProps {
    businessId: string
    cityId: string
}

export function EventsManager({ businessId, cityId }: EventsManagerProps) {
    const [url, setUrl] = useState('')
    const [isScraping, setIsScraping] = useState(false)
    const [events, setEvents] = useState<any[]>([]) // In real app, fetch initial events

    const handleScrape = async () => {
        if (!url) return

        setIsScraping(true)
        try {
            const result = await scrapeAndSaveEvent(url, businessId, cityId)

            if (result.success && result.data) {
                toast.success('Eveniment importat cu succes!')
                setEvents(prev => [result.data, ...prev])
                setUrl('')
            } else {
                toast.error(result.error || 'Eroare la importarea evenimentului')
            }
        } catch (error) {
            toast.error('A apărut o eroare neașteptată')
        } finally {
            setIsScraping(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Import Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Importă Eveniment (Facebook / Google)</CardTitle>
                    <CardDescription>
                        Introdu link-ul evenimentului de pe Facebook sau Google pentru a-l adăuga automat.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Label htmlFor="event-url" className="sr-only">URL Eveniment</Label>
                            <Input
                                id="event-url"
                                placeholder="https://facebook.com/events/... sau link Google"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleScrape} disabled={isScraping || !url}>
                            {isScraping ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Se importă...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Importă
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Events List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((event) => (
                    <Card key={event.id || event.url} className="overflow-hidden">
                        <div className="relative h-48 w-full">
                            {event.imageUrl ? (
                                <Image
                                    src={event.imageUrl}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400">
                                    <Calendar className="h-12 w-12" />
                                </div>
                            )}
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-bold text-lg mb-2 line-clamp-1">{event.title}</h3>
                            <div className="flex items-center text-sm text-slate-500 mb-2">
                                <Calendar className="h-4 w-4 mr-2" />
                                {event.startDate ? new Date(event.startDate).toLocaleDateString('ro-RO', {
                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                }) : 'Dată necunoscută'}
                            </div>
                            {event.location && (
                                <div className="flex items-center text-sm text-slate-500 mb-2">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {event.location}
                                </div>
                            )}
                            <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                                {event.description}
                            </p>
                            <Button variant="outline" size="sm" asChild className="w-full">
                                <a href={event.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Vezi evenimentul
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {events.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nu ai importat niciun eveniment încă.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
