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
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Application Error
              </h1>
              <p className="text-muted-foreground">
                A critical error occurred. Please refresh the page.
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <button
              onClick={reset}
              className="bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all px-6 py-3"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

