'use client'

import { useEffect } from 'react'
import { Button } from '@/components/shared/ui/button'
import { AlertCircle, Home } from 'lucide-react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to error monitoring
    logger.error('Application error', error, { digest: error.digest })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-20 w-20 rounded-airbnb-lg bg-red-50 flex items-center justify-center mx-auto">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-airbnb-dark">
            Something went wrong!
          </h1>
          <p className="text-airbnb-gray">
            We're sorry, but something unexpected happened. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-airbnb-gray mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="airbnb-button"
          >
            Try Again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

