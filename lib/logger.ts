/**
 * Centralized logging utility
 * Only logs in development, always logs errors
 * Errors are logged to console and can be sent to custom monitoring endpoint
 */

const isDev = process.env.NODE_ENV === 'development'

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  log(message: string, ...args: unknown[]): void {
    if (isDev) {
      console.log(this.formatMessage('log', message), ...args)
    }
  }

  info(message: string, context?: LogContext): void {
    if (isDev) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (isDev) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    // Always log errors, even in production
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    }
    console.error(this.formatMessage('error', message, errorContext))

    // Send to custom error monitoring endpoint in production
    if (!isDev && typeof window !== 'undefined') {
      // Client-side: send to error monitoring API
      this.sendToMonitoring(message, error, context).catch(() => {
        // Silently fail if monitoring endpoint is not available
      })
    }
  }

  private async sendToMonitoring(
    message: string,
    error?: unknown,
    context?: LogContext
  ): Promise<void> {
    try {
      await fetch('/api/monitoring/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          } : error,
          context,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      })
    } catch {
      // Silently fail - monitoring is optional
    }
  }

  debug(message: string, context?: LogContext): void {
    if (isDev) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }
}

export const logger = new Logger()

