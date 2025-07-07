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