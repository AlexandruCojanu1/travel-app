type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
}

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry = this.formatMessage(level, message, data)
    const output = data 
      ? `[${entry.timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}`
      : `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`
    
    switch (level) {
      case 'error':
        console.error(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(output)
        }
        break
      default:
        console.log(output)
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, error?: unknown, data?: unknown): void {
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack, ...data as object }
      : { error, ...data as object }
    this.log('error', message, errorData)
  }
}

export const logger = new Logger()
