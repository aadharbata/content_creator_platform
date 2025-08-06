import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { checkDatabaseConnection, disconnectDatabase } from './utils/database'
import { logger, socketLogger } from './utils/logger'
import { authenticateSocket, AuthenticatedSocket } from './middleware/auth'
import { MessageHandler } from './handlers/messageHandler'
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData 
} from './types/events'

// Environment variables validation
const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

// Create Express app
const app = express()
const httpServer = createServer(app)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow WebSocket connections
}))

// CORS configuration
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size,
    offlineMessageQueues: offlineMessages.size
  })
})

// Debug endpoint (only in development)
if (NODE_ENV === 'development') {
  app.get('/debug/state', (req, res) => {
    res.json({
      connectedUsers: Array.from(connectedUsers.entries()),
      offlineMessages: Array.from(offlineMessages.entries()).map(([userId, messages]) => ({
        userId,
        messageCount: messages.length,
        messages: messages.map(m => ({ id: m.id, text: m.text.substring(0, 50) + '...', senderId: m.senderId }))
      })),
      socketToUser: Array.from(socketToUser.entries())
    })
  })
}

// Rate limiting for HTTP endpoints
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per minute
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)
app.use(express.json({ limit: '10mb' }))

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await checkDatabaseConnection()
    const status = dbHealthy ? 'healthy' : 'unhealthy'
    const statusCode = dbHealthy ? 200 : 503
    
    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      service: 'websocket-server',
      version: '1.0.0',
      database: dbHealthy ? 'connected' : 'disconnected'
    })
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'websocket-server',
      version: '1.0.0',
      error: 'Internal server error'
    })
  }
})

// Socket.io server setup
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  // Connection state recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
})

// Socket.io middleware
io.use(authenticateSocket)

// Initialize message handler
const messageHandler = new MessageHandler(io)

// Simple in-memory storage for offline messages
// In production, this should be stored in a database
const offlineMessages = new Map<string, Array<{
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  roomId: string;
}>>()

// Track connected users and their socket IDs
const connectedUsers = new Map<string, string>() // userId -> socketId
const socketToUser = new Map<string, string>() // socketId -> userId

// Socket connection handling
io.on('connection', (socket: AuthenticatedSocket) => {
  const { userId, userName, userRole } = socket.data
  
  socketLogger.info('User connected', {
    socketId: socket.id,
    userId,
    userName,
    userRole,
    transport: socket.conn.transport.name
  })

  // Join user to their personal room
  socket.join(`user:${userId}`)
  
  // Join role-based rooms if needed
  if (userRole === 'CREATOR') {
    socket.join(`creators`)
  } else if (userRole === 'CONSUMER') {
    socket.join(`consumers`)
  }

  // Auto-join user to their community rooms
  messageHandler.handleAutoJoinCommunities(socket)

  // DEVELOPMENT: Auto-join community rooms based on events
  if (NODE_ENV === 'development') {
    // Auto-join common test communities
    const testCommunities = ['test-community-1', 'test-community-2', 'general'];
    testCommunities.forEach(communityId => {
      socket.join(`community:${communityId}`);
      socketLogger.info('Auto-joined test community in development', {
        socketId: socket.id,
        userId,
        communityId
      });
    });
  }

  // Send connection confirmation
  socket.emit('connected', {
    userId,
    timestamp: new Date()
  })

  // Message event handlers
  socket.on('send_message', (data) => {
    messageHandler.handleSendMessage(socket, data)
  })

  socket.on('join_conversation', (data) => {
    messageHandler.handleJoinConversation(socket, data)
  })

  socket.on('leave_conversation', (data) => {
    messageHandler.handleLeaveConversation(socket, data)
  })

  socket.on('mark_as_read', (data) => {
    messageHandler.handleMarkAsRead(socket, data)
  })

  socket.on('typing_start', (data) => {
    messageHandler.handleTypingStart(socket, data)
  })

  socket.on('typing_stop', (data) => {
    messageHandler.handleTypingStop(socket, data)
  })

  // Community message handlers
  socket.on('send_community_message', (data) => {
    messageHandler.handleSendCommunityMessage(socket, data)
  })

  socket.on('community_typing_start', (data) => {
    messageHandler.handleCommunityTypingStart(socket, data)
  })

  socket.on('community_typing_stop', (data) => {
    messageHandler.handleCommunityTypingStop(socket, data)
  })

  // Community join/leave handlers
  socket.on('join_community', (data) => {
    messageHandler.handleJoinCommunity(socket, data)
  })

  socket.on('leave_community', (data) => {
    messageHandler.handleLeaveCommunity(socket, data)
  })

  // TEST HANDLERS for community chat testing (development only)
  if (NODE_ENV === 'development') {
    socket.on('test_join_community', (data: { communityId: string }) => {
      socketLogger.info('Test user joining community', {
        socketId: socket.id,
        userId: socket.data.userId,
        communityId: data.communityId
      })
      
      // Join the community room
      socket.join(`community:${data.communityId}`)
      
      // Send confirmation
      socket.emit('test_community_joined', {
        communityId: data.communityId,
        message: `Joined community ${data.communityId}`
      })
    })

    socket.on('test_send_community_message', (data: { communityId: string; content: string }) => {
      socketLogger.info('Test community message', {
        socketId: socket.id,
        userId: socket.data.userId,
        communityId: data.communityId,
        contentLength: data.content.length
      })

      const message = {
        id: `test-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: data.content,
        createdAt: new Date(),
        senderId: socket.data.userId,
        sender: {
          id: socket.data.userId,
          name: socket.data.userName,
          avatarUrl: null
        }
      }

      // Broadcast to all users in the community room
      socket.to(`community:${data.communityId}`).emit('new_message', message)
      
      // Send back to sender for confirmation
      socket.emit('new_message', message)
    })
  }

  // TEST HANDLERS for chat-test page
  socket.on('join', (data: { userId: string, userName: string }) => {
    socketLogger.info('Test user joined', {
      socketId: socket.id,
      userId: data.userId,
      userName: data.userName
    })
    
    // Check if user was already connected with a different socket
    const existingSocketId = connectedUsers.get(data.userId)
    if (existingSocketId && existingSocketId !== socket.id) {
      socketLogger.info('User was connected with different socket, updating tracking', {
        userId: data.userId,
        oldSocketId: existingSocketId,
        newSocketId: socket.id
      })
      // Clean up old socket mapping
      socketToUser.delete(existingSocketId)
    }
    
    // Track connected user in both directions
    connectedUsers.set(data.userId, socket.id)
    socketToUser.set(socket.id, data.userId)
    
    // Store user data in socket for later use (using a custom property)
    ;(socket as any).testUserId = data.userId
    ;(socket as any).testUserName = data.userName
    
    // Deliver any offline messages
    const userOfflineMessages = offlineMessages.get(data.userId) || []
    if (userOfflineMessages.length > 0) {
      socketLogger.info('Delivering offline messages', {
        socketId: socket.id,
        userId: data.userId,
        messageCount: userOfflineMessages.length,
        messageIds: userOfflineMessages.map(m => m.id)
      })
      
      // Make a copy for delivery but don't clear the queue yet
      const messagesToDeliver = [...userOfflineMessages]
      
      // Group messages by room and auto-join rooms first
      const roomsToJoin = new Set<string>()
      const sendersToCreate = new Set<string>()
      
      messagesToDeliver.forEach(message => {
        roomsToJoin.add(message.roomId)
        sendersToCreate.add(message.senderId)
      })
      
      // Auto-join all the rooms for the offline messages first
      roomsToJoin.forEach(roomId => {
        socket.join(roomId)
        socketLogger.info('Auto-joined room for offline messages', {
          socketId: socket.id,
          userId: data.userId,
          roomId
        })
      })
      
      // Auto-create chat tabs for unique senders
      sendersToCreate.forEach(senderId => {
        const sampleMessage = messagesToDeliver.find(m => m.senderId === senderId)
        if (sampleMessage) {
          socket.emit('autoCreateChat', {
            targetUserId: sampleMessage.senderId,
            targetUserName: sampleMessage.senderName,
            roomId: sampleMessage.roomId
          })
        }
      })
      
      // Deliver messages synchronously without delays to prevent loss
      socketLogger.info('Starting synchronous delivery of offline messages', {
        userId: data.userId,
        messageCount: messagesToDeliver.length
      })
      
      messagesToDeliver.forEach((message, index) => {
        socketLogger.info('Delivering offline message', {
          userId: data.userId,
          messageIndex: index + 1,
          totalMessages: messagesToDeliver.length,
          messageId: message.id,
          senderId: message.senderId
        })
        socket.emit('receiveMessage', message)
      })
      
      // Clear offline messages only after successful delivery
      offlineMessages.delete(data.userId)
      socketLogger.info('Successfully delivered and cleared offline messages queue', {
        userId: data.userId,
        messageCount: messagesToDeliver.length
      })
    }
    
    // Broadcast to other users in the same "general" room
    socket.broadcast.emit('userJoined', {
      userId: data.userId,
      userName: data.userName
    })
  })

  socket.on('joinRoom', (data: { roomId: string, userId: string, targetUserId: string }) => {
    socket.join(data.roomId)
    socketLogger.info('Test user joined room', {
      socketId: socket.id,
      userId: data.userId,
      roomId: data.roomId,
      targetUserId: data.targetUserId
    })
    // Notify others in the room
    socket.to(data.roomId).emit('userJoined', {
      userId: data.userId,
      userName: socket.data.userName
    })
  })

  socket.on('sendMessage', (data: { id: string, text: string, senderId: string, senderName: string, timestamp: Date, roomId: string, targetUserId: string }) => {
    socketLogger.info('Test message sent', {
      socketId: socket.id,
      userId: data.senderId,
      roomId: data.roomId,
      messageLength: data.text.length,
      targetUserId: data.targetUserId
    })
    
    const message = {
      id: data.id,
      text: data.text,
      senderId: data.senderId,
      senderName: data.senderName,
      timestamp: data.timestamp
    }
    
    // Check if target user is connected
    const targetSocketId = connectedUsers.get(data.targetUserId)
    
    socketLogger.info('Checking target user connection', {
      targetUserId: data.targetUserId,
      targetSocketId,
      connectedUsersCount: connectedUsers.size,
      connectedUsersList: Array.from(connectedUsers.keys())
    })
    
    if (targetSocketId) {
      socketLogger.info('Target user is online', {
        targetUserId: data.targetUserId,
        targetSocketId
      })
      
      // Target user is online - send message to room
      socket.to(data.roomId).emit('receiveMessage', message)
      
      // Check if target user has joined the room, if not send directly and auto-create chat
      const targetSocket = io.sockets.sockets.get(targetSocketId)
      if (targetSocket) {
        // Check if target user is in the room
        const isInRoom = targetSocket.rooms.has(data.roomId)
        
        if (!isInRoom) {
          // Target user hasn't joined the room yet, send directly and auto-create chat
          targetSocket.emit('receiveMessage', message)
          targetSocket.emit('autoCreateChat', {
            targetUserId: data.senderId,
            targetUserName: data.senderName,
            roomId: data.roomId
          })
        }
        // If they're in the room, they'll get the message via socket.to(data.roomId).emit above
      }
    } else {
      socketLogger.info('Target user is offline, storing message', {
        targetUserId: data.targetUserId,
        messageId: data.id,
        currentOfflineMessagesCount: offlineMessages.get(data.targetUserId)?.length || 0
      })
      
      // Target user is offline - store message for delivery
      if (!offlineMessages.has(data.targetUserId)) {
        offlineMessages.set(data.targetUserId, [])
        socketLogger.info('Created new offline message queue', {
          targetUserId: data.targetUserId
        })
      }
      
      const userMessages = offlineMessages.get(data.targetUserId)!
      
      // Check for duplicate messages to prevent storing the same message twice
      const messageExists = userMessages.some(msg => msg.id === data.id)
      if (!messageExists) {
        userMessages.push({
          id: data.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          timestamp: data.timestamp,
          roomId: data.roomId
        })
        
        socketLogger.info('Message stored for offline user', {
          targetUserId: data.targetUserId,
          senderId: data.senderId,
          offlineMessageCount: userMessages.length,
          messageId: data.id,
          allOfflineQueues: Array.from(offlineMessages.keys()).map(userId => ({
            userId,
            messageCount: offlineMessages.get(userId)?.length || 0
          }))
        })
      } else {
        socketLogger.info('Duplicate message not stored - message already exists', {
          targetUserId: data.targetUserId,
          messageId: data.id,
          senderId: data.senderId
        })
      }
    }
  })

  // Handle client errors
  socket.on('error', (error) => {
    socketLogger.error('Socket error', {
      socketId: socket.id,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  })

  // Handle transport changes
  socket.conn.on('upgrade', () => {
    socketLogger.info('Transport upgraded', {
      socketId: socket.id,
      userId,
      transport: socket.conn.transport.name
    })
  })

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    socketLogger.info('User disconnected', {
      socketId: socket.id,
      userId,
      userName,
      reason,
      duration: Date.now() - new Date(socket.handshake.time).getTime()
    })

    // Remove user from connected users map (check both auth and test modes)
    const testUserId = (socket as any).testUserId
    const disconnectingUserId = userId || testUserId
    
    if (disconnectingUserId) {
      // Only remove if this socket is the current one for this user
      const currentSocketId = connectedUsers.get(disconnectingUserId)
      if (currentSocketId === socket.id) {
        connectedUsers.delete(disconnectingUserId)
        socketLogger.info('Removed user from connection tracking', {
          socketId: socket.id,
          userId: disconnectingUserId
        })
      } else {
        socketLogger.info('Socket disconnected but user has different active socket', {
          socketId: socket.id,
          userId: disconnectingUserId,
          currentSocketId
        })
      }
      
      socketToUser.delete(socket.id)
      
      // Log current offline message status
      const offlineMessageCount = offlineMessages.get(disconnectingUserId)?.length || 0
      socketLogger.info('User disconnect - offline message status', {
        userId: disconnectingUserId,
        offlineMessageCount,
        remainingConnectedUsers: connectedUsers.size
      })
    }

    // Broadcast user left for test mode
    if (process.env.NODE_ENV === 'development') {
      const testUserName = (socket as any).testUserName
      const disconnectingUserName = userName || testUserName
      
      socket.broadcast.emit('userLeft', {
        userId: disconnectingUserId,
        userName: disconnectingUserName
      })
    }
  })

  // Handle connection errors
  socket.on('connect_error', (error) => {
    socketLogger.error('Connection error', {
      socketId: socket.id,
      userId,
      error: error.message
    })
  })
})

// Global error handlers for Socket.io
io.engine.on('connection_error', (err) => {
  socketLogger.error('Socket.io connection error', {
    code: err.code,
    message: err.message,
    context: err.context
  })
})

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`)
  
  // Stop accepting new connections
  httpServer.close(() => {
    logger.info('HTTP server closed')
  })
  
  // Close all socket connections
  io.close(() => {
    logger.info('Socket.io server closed')
  })
  
  // Disconnect from database
  await disconnectDatabase()
  
  logger.info('Graceful shutdown completed')
  process.exit(0)
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
const startServer = async () => {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection()
    if (!dbConnected) {
      logger.error('Failed to connect to database')
      process.exit(1)
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`WebSocket server started`, {
        port: PORT,
        environment: NODE_ENV,
        allowedOrigins: ALLOWED_ORIGINS,
        pid: process.pid
      })
      
      logger.info('Server is ready to accept connections')
    })

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise })
  process.exit(1)
})

// Start the server
startServer() 