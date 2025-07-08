"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = exports.isValidUUID = exports.checkConversationAccess = void 0;
exports.authenticateSocket = authenticateSocket;
const jwt_1 = require("next-auth/jwt");
const database_1 = require("../utils/database");
const logger_1 = require("../utils/logger");
const cookie = __importStar(require("cookie"));
const logger_2 = require("../utils/logger");
async function authenticateSocket(socket, next) {
    const cookieString = socket.handshake.headers.cookie;
    if (!cookieString) {
        logger_2.socketLogger.warn('Authentication error: No cookie provided', { socketId: socket.id });
        return next(new Error('Authentication credentials required'));
    }
    const cookies = cookie.parse(cookieString);
    const token = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
    if (!token) {
        logger_2.socketLogger.warn('Authentication error: No session token found in cookie', { socketId: socket.id });
        return next(new Error('Authentication token required'));
    }
    try {
        const decodedToken = await (0, jwt_1.decode)({
            token,
            secret: process.env.NEXTAUTH_SECRET,
        });
        if (!decodedToken || !decodedToken.id || !decodedToken.name || !decodedToken.role) {
            logger_2.socketLogger.warn('Authentication error: Invalid or incomplete token', {
                socketId: socket.id,
            });
            return next(new Error('Invalid authentication token'));
        }
        const userRole = decodedToken.role;
        if (userRole !== 'CREATOR' && userRole !== 'CONSUMER' && userRole !== 'ADMIN') {
            logger_2.socketLogger.warn('Authentication error: Invalid user role in token', {
                socketId: socket.id,
                role: userRole,
            });
            return next(new Error('Invalid user role'));
        }
        socket.data = {
            userId: decodedToken.id,
            userName: decodedToken.name,
            userRole: userRole,
        };
        logger_2.socketLogger.info('User authenticated successfully via cookie', {
            socketId: socket.id,
            userId: decodedToken.id,
        });
        return next();
    }
    catch (error) {
        logger_2.socketLogger.error('Authentication error: Token decoding failed', {
            socketId: socket.id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return next(new Error('Authentication error'));
    }
}
const checkConversationAccess = async (socket, conversationId) => {
    try {
        const conversation = await database_1.databaseUtils.getConversationWithAccess(conversationId, socket.data.userId);
        if (!conversation) {
            logger_1.authLogger.warn('Unauthorized conversation access attempt', {
                socketId: socket.id,
                userId: socket.data.userId,
                conversationId
            });
            return false;
        }
        return true;
    }
    catch (error) {
        logger_1.authLogger.error('Error checking conversation access', {
            socketId: socket.id,
            userId: socket.data.userId,
            conversationId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return false;
    }
};
exports.checkConversationAccess = checkConversationAccess;
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
const rateLimitMap = new Map();
const checkRateLimit = (socketId, maxRequests = 10, windowMs = 60000) => {
    const now = Date.now();
    const userLimit = rateLimitMap.get(socketId);
    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(socketId, {
            count: 1,
            resetTime: now + windowMs
        });
        return true;
    }
    if (userLimit.count >= maxRequests) {
        logger_1.authLogger.warn('Rate limit exceeded', {
            socketId,
            count: userLimit.count,
            maxRequests
        });
        return false;
    }
    userLimit.count++;
    return true;
};
exports.checkRateLimit = checkRateLimit;
setInterval(() => {
    const now = Date.now();
    for (const [socketId, limit] of rateLimitMap.entries()) {
        if (now > limit.resetTime) {
            rateLimitMap.delete(socketId);
        }
    }
}, 60000);
//# sourceMappingURL=auth.js.map