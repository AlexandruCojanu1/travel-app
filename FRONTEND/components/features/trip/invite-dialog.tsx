"use client"

import { useState, useEffect } from "react"
import { Copy, Check, Loader2, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/shared/ui/dialog"
import { Button } from "@/components/shared/ui/button"
import { generateInviteLink } from "@/actions/trip/collaboration"

interface InviteDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    tripId: string
    tripTitle?: string
}

export function InviteDialog({ isOpen, onOpenChange, tripId, tripTitle }: InviteDialogProps) {
    const [link, setLink] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && !link) {
            handleGenerate()
        }
    }, [isOpen, tripId])

    const handleGenerate = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await generateInviteLink(tripId)
            if (result.success && result.token) {
                const url = `${window.location.origin}/join/${result.token}`
                setLink(url)
            } else {
                throw new Error(result.error || "Failed to generate link")
            }
        } catch (err) {
            setError("Nu am putut genera link-ul. Încearcă din nou.")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (link) {
            navigator.clipboard.writeText(link)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Invită prieteni în {tripTitle || "călătorie"}
                    </DialogTitle>
                    <DialogDescription>
                        Trimite acest link prietenilor tăi pentru a planifica împreună.
                        Ei vor putea vedea itinerariul și vota activități.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                            <p className="text-sm">Generăm link-ul unic...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg">
                            <p>{error}</p>
                            <Button onClick={handleGenerate} variant="outline" size="sm" className="mt-2">
                                Încearcă din nou
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <label htmlFor="link" className="sr-only">
                                    Link
                                </label>
                                <input
                                    id="link"
                                    type="text"
                                    readOnly
                                    value={link || ""}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                                <span className="sr-only">Copiază</span>
                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-md">
                        <p className="font-semibold mb-1">Cum funcționează?</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Toți cei cu link-ul se alătură grupului</li>
                            <li>Puteți vota activități împreună</li>
                            <li>Dacă majoritatea votează "Da", activitatea se adaugă automat în plan</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
