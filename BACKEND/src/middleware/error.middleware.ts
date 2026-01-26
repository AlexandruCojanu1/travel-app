import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger.js'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  logger.error('API Error', err, {
    method: req.method,
    path: req.path,
    statusCode,
  })

  res.status(statusCode).json({
    error: message,
    code: err.code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

export function createError(message: string, statusCode: number = 500, code?: string): ApiError {
  const error: ApiError = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}
