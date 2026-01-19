"use client"

import { useState } from "react"
import { MapPin, Trophy } from "lucide-react"
import { checkLocationAchievement, getUserPassport } from "@/actions/gamification"
import { toast } from "sonner"
import { Button } from "@/components/shared/ui/button"
import { ClaimPopup } from "@/components/features/gamification/claim-popup"
import { Achievement } from "@/actions/gamification"

interface CheckInButtonProps {
    cityName: string
}

export function CheckInButton({ cityName }: CheckInButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showClaim, setShowClaim] = useState(false)
    const [unlocked, setUnlocked] = useState<Achievement | null>(null)

    const handleCheckIn = async () => {
        setIsLoading(true)
        try {
            // In a real production app, we would get coordinates here via navigator.geolocation
            // and pass them to backend to verify proximity to 'cityName'.
            // For this implementation, we assume the user is where they say they are.

            const result = await checkLocationAchievement(cityName)

            if (result.success && result.achievement) {
                setUnlocked(result.achievement)
                setShowClaim(true)
                toast.success(`Bun venit în ${cityName}! 🌟`)
            } else if (result.alreadyUnlocked) {
                toast.info(`Ai deja viza pentru ${cityName}!`)
            } else {
                toast.success(`Check-in înregistrat în ${cityName}.`)
            }
        } catch (error) {
            toast.error("Eroare la check-in.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button
                onClick={handleCheckIn}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-indigo-100 hover:bg-indigo-50 text-indigo-700"
            >
                <MapPin className="w-4 h-4" />
                {isLoading ? "Se verifică..." : `Check-in ${cityName}`}
            </Button>

            <ClaimPopup
                achievement={unlocked}
                isOpen={showClaim}
                onClose={() => setShowClaim(false)}
            />
        </>
    )
}
