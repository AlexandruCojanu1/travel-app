import { Request, Response, NextFunction } from 'express'
import { verifyUserToken } from '../lib/supabase.js'
import { createError } from './error.middleware.js'
import { User } from '@supabase/supabase-js'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
      accessToken?: string
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw createError('No authorization token provided', 401, 'UNAUTHORIZED')
    }

    const token = authHeader.replace('Bearer ', '')
    const user = await verifyUserToken(token)

    if (!user) {
      throw createError('Invalid or expired token', 401, 'INVALID_TOKEN')
    }

    req.user = user
    req.accessToken = token
    next()
  } catch (error) {
    next(error)
  }
}

// Optional auth - doesn't fail if no token, just sets user to undefined
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const user = await verifyUserToken(token)
      
      if (user) {
        req.user = user
        req.accessToken = token
      }
    }

    next()
  } catch (error) {
    // Silently continue without auth
    next()
  }
}
