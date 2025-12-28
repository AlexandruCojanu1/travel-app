'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="h-20 w-20 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">
                Application Error
              </h1>
              <p className="text-slate-600">
                A critical error occurred. Please refresh the page.
              </p>
              {error.digest && (
                <p className="text-xs text-slate-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

