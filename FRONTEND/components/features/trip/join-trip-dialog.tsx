"use client"

import { useState } from "react"
import { Users, ArrowRight, Loader2, Link as LinkIcon, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/shared/ui/dialog"
import { Button } from "@/components/shared/ui/button"
import { joinTrip } from "@/actions/trip/collaboration"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface JoinTripDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function JoinTripDialog({ isOpen, onOpenChange }: JoinTripDialogProps) {
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleJoin = async () => {
        if (!input.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            // Extract token from URL if full URL is pasted
            let token = input.trim()
            if (token.includes('/join/')) {
                const parts = token.split('/join/')
                if (parts[1]) {
                    token = parts[1].split('?')[0] // Clean potential params
                }
            }

            const result = await joinTrip(token)

            if (result.success && result.tripId) {
                toast.success("Te-ai alăturat cu succes grupului!")
                onOpenChange(false)
                router.push(`/plan?tripId=${result.tripId}`)
            } else {
                setError(result.error || "Link invalid sau expirat.")
            }
        } catch (err) {
            setError("A apărut o eroare. Încearcă din nou.")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Colaborează la o călătorie
                    </DialogTitle>
                    <DialogDescription>
                        Introdu link-ul de invitație primit de la prietenii tăi pentru a te alătura grupului.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="invite-link" className="text-sm font-medium text-gray-700">
                            Link invitație sau Cod
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                id="invite-link"
                                type="text"
                                placeholder="https://app.com/join/..."
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value)
                                    setError(null)
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Anulează
                        </Button>
                        <Button
                            onClick={handleJoin}
                            disabled={!input.trim() || isLoading}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Se verifică...
                                </>
                            ) : (
                                <>
                                    Alătură-te
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
