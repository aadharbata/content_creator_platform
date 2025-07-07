import { decode } from 'next-auth/jwt'
import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { databaseUtils } from '../utils/database'
import { authLogger } from '../utils/logger'
import { SocketData } from '../types/events'

// Extend Socket interface to include user data
export interface AuthenticatedSocket extends Socket {
  data: SocketData
}

type UserRole = 'CREATOR' | 'CONSUMER' | 'ADMIN'
interface TokenPayload {
  id?: string
  sub?: string
  name?: string
  role?: UserRole
  userId?: string // legacy field from old tokens
  userName?: string
  iat?: number
  exp?: number
}

// JWT authentication middleware for Socket.io
export const authenticateSocket = async (
  socket: Socket,
  next: (err?: ExtendedError) => void
): Promise<void> => {
  try {
    // Extract token from handshake auth
    const token = socket.handshake.auth?.token

    if (!token) {
      authLogger.warn('Connection attempt without token', {
        socketId: socket.id,
        ip: socket.handshake.address
      })
      return next(new Error('Authentication token required'))
    }

    // Verify JWT token via next-auth/jwt
    const jwtSecret = process.env.NEXTAUTH_SECRET
    if (!jwtSecret) {
      authLogger.error('NEXTAUTH_SECRET not configured')
      return next(new Error('Server configuration error'))
    }

    const decoded = (await decode({ token, secret: jwtSecret })) as TokenPayload | null

    if (!decoded) {
      authLogger.warn('Invalid JWT token', {
        socketId: socket.id,
        ip: socket.handshake.address
      })
      return next(new Error('Invalid authentication token'))
    }

    const userId = decoded.userId ?? decoded.id ?? decoded.sub
    const userRole = decoded.role
    const userName = decoded.userName ?? decoded.name ?? ''

    // Validate token payload
    if (!userId || !userRole) {
      authLogger.warn('Invalid token payload', {
        socketId: socket.id,
        payload: decoded
      })
      return next(new Error('Invalid token payload'))
    }

    // Check if user exists in database
    const user = await databaseUtils.getUserById(userId);
    if (!user) {
      authLogger.warn('User not found for valid token', {
        socketId: socket.id,
        userId
      })
      return next(new Error('User not found'))
    }

    // Verify role matches
    if (user.role !== userRole) {
      authLogger.warn('Role mismatch in token', {
        socketId: socket.id,
        userId: user.id,
        tokenRole: userRole,
        userRole: user.role
      })
      return next(new Error('Invalid user role'))
    }

    // Attach user data to socket
    const socketData: SocketData = {
      userId: user.id,
      userRole: user.role as 'CREATOR' | 'CONSUMER' | 'ADMIN',
      userName: userName || user.name
    }

    // Type assertion to add data property
    ;(socket as AuthenticatedSocket).data = socketData

    authLogger.info('User authenticated successfully', {
      socketId: socket.id,
      userId: user.id,
      userName: user.name,
      role: user.role
    })

    next()
  } catch (error) {
    authLogger.error('Authentication error', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    next(new Error('Authentication failed'))
  }
}

// Middleware to check if user has access to a conversation
export const checkConversationAccess = async (
  socket: AuthenticatedSocket,
  conversationId: string
): Promise<boolean> => {
  try {
    const conversation = await databaseUtils.getConversationWithAccess(
      conversationId,
      socket.data.userId
    )

    if (!conversation) {
      authLogger.warn('Unauthorized conversation access attempt', {
        socketId: socket.id,
        userId: socket.data.userId,
        conversationId
      })
      return false
    }

    return true
  } catch (error) {
    authLogger.error('Error checking conversation access', {
      socketId: socket.id,
      userId: socket.data.userId,
      conversationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return false
  }
}

// Utility function to validate UUID format
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Rate limiting for socket events
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const checkRateLimit = (
  socketId: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean => {
  const now = Date.now()
  const userLimit = rateLimitMap.get(socketId)

  if (!userLimit || now > userLimit.resetTime) {
    // First request or window expired
    rateLimitMap.set(socketId, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (userLimit.count >= maxRequests) {
    authLogger.warn('Rate limit exceeded', {
      socketId,
      count: userLimit.count,
      maxRequests
    })
    return false
  }

  userLimit.count++
  return true
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now()
  for (const [socketId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(socketId)
    }
  }
}, 60000) // Clean up every minute 