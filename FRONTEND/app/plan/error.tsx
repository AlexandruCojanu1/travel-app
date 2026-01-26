'use client'

import { useEffect } from 'react'
import { Button } from '@/components/shared/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function PlanError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Plan Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                A apărut o problemă cu planul tău
            </h2>
            <p className="text-gray-500 max-w-md mb-8">
                Nu am putut încărca detaliile călătoriei. Te rugăm să încerci din nou sau să verifici conexiunea la internet.
            </p>
            <div className="flex gap-4">
                <Button
                    onClick={() => window.location.href = '/home'}
                    variant="outline"
                >
                    Înapoi la Home
                </Button>
                <Button
                    onClick={reset}
                    className="bg-mova-blue text-white hover:bg-blue-700"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Încearcă din nou
                </Button>
            </div>
        </div>
    )
}
