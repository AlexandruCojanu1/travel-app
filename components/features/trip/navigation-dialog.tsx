import React from 'react'
import { Car, Map } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/shared/ui/dialog"
import { Button } from "@/components/shared/ui/button"

interface NavigationDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    destination: {
        latitude: number
        longitude: number
        name: string
    } | null
}

export function NavigationDialog({ isOpen, onOpenChange, destination }: NavigationDialogProps) {
    if (!destination) return null

    const handleOpenWaze = () => {
        const url = `https://waze.com/ul?ll=${destination.latitude},${destination.longitude}&navigate=yes`
        window.open(url, '_blank')
        onOpenChange(false)
    }

    const handleOpenGoogleMaps = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`
        window.open(url, '_blank')
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Navighează către {destination.name}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center h-24 gap-2 hover:border-primary hover:bg-primary/5"
                        onClick={handleOpenWaze}
                    >
                        <Car className="h-8 w-8 text-primary" />
                        <span className="font-semibold">Waze</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center h-24 gap-2 hover:border-secondary hover:bg-secondary/5"
                        onClick={handleOpenGoogleMaps}
                    >
                        <Map className="h-8 w-8 text-secondary" />
                        <span className="font-semibold">Google Maps</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
