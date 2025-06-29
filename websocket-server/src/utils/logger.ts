import winston from 'winston'

const logLevel = process.env.LOG_LEVEL || 'info'

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info
    
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\n${stack}`
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return logMessage
  })
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info
    
    let logMessage = `${timestamp} ${level}: ${message}`
    
    if (stack) {
      logMessage += `\n${stack}`
    }
    
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return logMessage
  })
)

// Create transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
  })
]

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
})

// Create specialized loggers for different contexts
export const createContextLogger = (context: string) => {
  return {
    info: (message: string, meta?: any) => 
      logger.info(`[${context}] ${message}`, meta),
    warn: (message: string, meta?: any) => 
      logger.warn(`[${context}] ${message}`, meta),
    error: (message: string, meta?: any) => 
      logger.error(`[${context}] ${message}`, meta),
    debug: (message: string, meta?: any) => 
      logger.debug(`[${context}] ${message}`, meta)
  }
}

// Specific loggers for different parts of the application
export const socketLogger = createContextLogger('SOCKET')
export const authLogger = createContextLogger('AUTH')
export const messageLogger = createContextLogger('MESSAGE')
export const dbLogger = createContextLogger('DATABASE')

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason })
  process.exit(1)
}) 