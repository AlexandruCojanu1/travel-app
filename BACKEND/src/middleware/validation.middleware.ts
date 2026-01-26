import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { createError } from './error.middleware.js'

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ')
        next(createError(`Validation error: ${message}`, 400, 'VALIDATION_ERROR'))
      } else {
        next(error)
      }
    }
  }
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query) as any
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ')
        next(createError(`Validation error: ${message}`, 400, 'VALIDATION_ERROR'))
      } else {
        next(error)
      }
    }
  }
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params) as any
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ')
        next(createError(`Validation error: ${message}`, 400, 'VALIDATION_ERROR'))
      } else {
        next(error)
      }
    }
  }
}
