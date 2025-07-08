"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./utils/database");
const logger_1 = require("./utils/logger");
const auth_1 = require("./middleware/auth");
const messageHandler_1 = require("./handlers/messageHandler");
const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger_1.logger.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.get('/health', async (req, res) => {
    try {
        const dbHealthy = await (0, database_1.checkDatabaseConnection)();
        const status = dbHealthy ? 'healthy' : 'unhealthy';
        const statusCode = dbHealthy ? 200 : 503;
        res.status(statusCode).json({
            status,
            timestamp: new Date().toISOString(),
            service: 'websocket-server',
            version: '1.0.0',
            database: dbHealthy ? 'connected' : 'disconnected'
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'websocket-server',
            version: '1.0.0',
            error: 'Internal server error'
        });
    }
});
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
    }
});
io.use(auth_1.authenticateSocket);
const messageHandler = new messageHandler_1.MessageHandler(io);
io.on('connection', (socket) => {
    const { userId, userName, userRole } = socket.data;
    logger_1.socketLogger.info('User connected', {
        socketId: socket.id,
        userId,
        userName,
        userRole,
        transport: socket.conn.transport.name
    });
    socket.join(`user:${userId}`);
    if (userRole === 'CREATOR') {
        socket.join(`creators`);
    }
    else if (userRole === 'CONSUMER') {
        socket.join(`consumers`);
    }
    messageHandler.handleAutoJoinCommunities(socket);
    socket.emit('connected', {
        userId,
        timestamp: new Date()
    });
    socket.on('send_message', (data) => {
        messageHandler.handleSendMessage(socket, data);
    });
    socket.on('join_conversation', (data) => {
        messageHandler.handleJoinConversation(socket, data);
    });
    socket.on('leave_conversation', (data) => {
        messageHandler.handleLeaveConversation(socket, data);
    });
    socket.on('mark_as_read', (data) => {
        messageHandler.handleMarkAsRead(socket, data);
    });
    socket.on('typing_start', (data) => {
        messageHandler.handleTypingStart(socket, data);
    });
    socket.on('typing_stop', (data) => {
        messageHandler.handleTypingStop(socket, data);
    });
    socket.on('send_community_message', (data) => {
        messageHandler.handleSendCommunityMessage(socket, data);
    });
    socket.on('community_typing_start', (data) => {
        messageHandler.handleCommunityTypingStart(socket, data);
    });
    socket.on('community_typing_stop', (data) => {
        messageHandler.handleCommunityTypingStop(socket, data);
    });
    socket.on('error', (error) => {
        logger_1.socketLogger.error('Socket error', {
            socketId: socket.id,
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    });
    socket.conn.on('upgrade', () => {
        logger_1.socketLogger.info('Transport upgraded', {
            socketId: socket.id,
            userId,
            transport: socket.conn.transport.name
        });
    });
    socket.on('disconnect', (reason) => {
        logger_1.socketLogger.info('User disconnected', {
            socketId: socket.id,
            userId,
            userName,
            reason,
            duration: Date.now() - new Date(socket.handshake.time).getTime()
        });
    });
    socket.on('connect_error', (error) => {
        logger_1.socketLogger.error('Connection error', {
            socketId: socket.id,
            userId,
            error: error.message
        });
    });
});
io.engine.on('connection_error', (err) => {
    logger_1.socketLogger.error('Socket.io connection error', {
        code: err.code,
        message: err.message,
        context: err.context
    });
});
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}, starting graceful shutdown...`);
    httpServer.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
    io.close(() => {
        logger_1.logger.info('Socket.io server closed');
    });
    await (0, database_1.disconnectDatabase)();
    logger_1.logger.info('Graceful shutdown completed');
    process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
const startServer = async () => {
    try {
        const dbConnected = await (0, database_1.checkDatabaseConnection)();
        if (!dbConnected) {
            logger_1.logger.error('Failed to connect to database');
            process.exit(1);
        }
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`WebSocket server started`, {
                port: PORT,
                environment: NODE_ENV,
                allowedOrigins: ALLOWED_ORIGINS,
                pid: process.pid
            });
            logger_1.logger.info('Server is ready to accept connections');
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Promise Rejection:', { reason, promise });
    process.exit(1);
});
startServer();
//# sourceMappingURL=server.js.map