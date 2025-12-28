'use client'

import { useEffect } from "react"
import { logger } from '@/lib/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical errors
    logger.error('Global application error', error, { 
      digest: error.digest,
      level: 'fatal',
    })
  }, [error])
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="h-20 w-20 rounded-airbnb-lg bg-red-50 flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-airbnb-dark">
                Application Error
              </h1>
              <p className="text-airbnb-gray">
                A critical error occurred. Please refresh the page.
              </p>
              {error.digest && (
                <p className="text-xs text-airbnb-gray mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <button
              onClick={reset}
              className="airbnb-button px-6 py-3"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

