'use client'

import { useEffect } from 'react'
import { Button } from '@/components/shared/ui/button'
import { MapPinOff, RefreshCw } from 'lucide-react'

export default function ExploreError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Explore Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center bg-gray-50">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <MapPinOff className="h-10 w-10 text-gray-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Explorarea s-a oprit momentan
            </h2>
            <p className="text-gray-500 max-w-md mb-8 text-lg">
                Nu am putut încărca locațiile. S-ar putea să fie o problemă de conexiune sau serviciul este temporar indisponibil.
            </p>
            <Button
                onClick={reset}
                size="lg"
                className="bg-black text-white hover:bg-gray-800 rounded-full px-8"
            >
                <RefreshCw className="mr-2 h-5 w-5" />
                Reîncarcă Harta
            </Button>
        </div>
    )
}
