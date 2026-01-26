import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const authRouter = Router()

// Get current user profile
authRouter.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // User is already verified by middleware
    res.json({ user: req.user })
  } catch (error) {
    next(error)
  }
})

// Verify token endpoint
authRouter.post('/verify', async (req, res, next) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' })
    }

    // Import here to avoid circular dependencies
    const { verifyUserToken } = await import('../lib/supabase.js')
    const user = await verifyUserToken(token)
    
    if (!user) {
      return res.status(401).json({ valid: false, error: 'Invalid token' })
    }

    res.json({ valid: true, user })
  } catch (error) {
    next(error)
  }
})
