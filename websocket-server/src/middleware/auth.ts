import { decode } from 'next-auth/jwt'
import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { databaseUtils } from '../utils/database'
import { authLogger } from '../utils/logger'
import { SocketData } from '../types/events'
import * as cookie from 'cookie'
import { socketLogger } from '../utils/logger'

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
export async function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  const cookieString = socket.handshake.headers.cookie;

  if (!cookieString) {
    socketLogger.warn('Authentication error: No cookie provided', { socketId: socket.id });
    return next(new Error('Authentication credentials required'));
  }
  
  const cookies = cookie.parse(cookieString);
  // NextAuth.js uses a secure prefix in production, so we check for both names
  const token = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];


  if (!token) {
    socketLogger.warn('Authentication error: No session token found in cookie', { socketId: socket.id });
    return next(new Error('Authentication token required'));
  }

  try {
    const decodedToken = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET || 'Ishan',
    });

    if (!decodedToken || !decodedToken.id || !decodedToken.name || !decodedToken.role) {
      socketLogger.warn('Authentication error: Invalid or incomplete token', {
        socketId: socket.id,
      });
      return next(new Error('Invalid authentication token'));
    }

    const userRole = decodedToken.role as string;
    if (userRole !== 'CREATOR' && userRole !== 'CONSUMER' && userRole !== 'ADMIN') {
        socketLogger.warn('Authentication error: Invalid user role in token', {
            socketId: socket.id,
            role: userRole,
        });
        return next(new Error('Invalid user role'));
    }

    // Attach user data to the socket object
    (socket as AuthenticatedSocket).data = {
      userId: decodedToken.id as string,
      userName: decodedToken.name,
      userRole: userRole,
    };

    socketLogger.info('User authenticated successfully via cookie', {
      socketId: socket.id,
      userId: decodedToken.id,
    });

    return next();
  } catch (error) {
    socketLogger.error('Authentication error: Token decoding failed', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return next(new Error('Authentication error'));
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