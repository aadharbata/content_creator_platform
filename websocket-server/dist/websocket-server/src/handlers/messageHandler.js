"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const database_1 = require("../utils/database");
const logger_1 = require("../utils/logger");
const bad_words_1 = __importDefault(require("bad-words"));
const sendMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().uuid('Invalid conversation ID format'),
    content: zod_1.z.string()
        .min(1, 'Message cannot be empty')
        .max(1000, 'Message too long (max 1000 characters)')
        .transform(str => str.trim())
});
const joinConversationSchema = zod_1.z.object({
    conversationId: zod_1.z.string().uuid('Invalid conversation ID format')
});
const markAsReadSchema = zod_1.z.object({
    type: zod_1.z.enum(['conversation', 'community']),
    id: zod_1.z.string().uuid('Invalid ID format'),
});
const sendCommunityMessageSchema = zod_1.z.object({
    communityId: zod_1.z.string().uuid('Invalid community ID format'),
    content: zod_1.z.string().min(1, 'Message content cannot be empty').max(500, 'Message is too long'),
});
const communityTypingSchema = zod_1.z.object({
    communityId: zod_1.z.string().uuid('Invalid community ID format')
});
class MessageHandler {
    io;
    profanityFilter;
    constructor(io) {
        this.io = io;
        this.profanityFilter = new bad_words_1.default();
    }
    async handleAutoJoinCommunities(socket) {
        try {
            const memberships = await database_1.databaseUtils.getUserCommunityMemberships(socket.data.userId);
            for (const membership of memberships) {
                await socket.join(`community:${membership.communityId}`);
            }
            logger_1.messageLogger.info('User auto-joined communities', {
                socketId: socket.id,
                userId: socket.data.userId,
                communitiesJoined: memberships.length
            });
        }
        catch (error) {
            logger_1.messageLogger.error('Error auto-joining communities', {
                socketId: socket.id,
                userId: socket.data.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleSendMessage(socket, data) {
        try {
            if (!(0, auth_1.checkRateLimit)(socket.id, 10, 60000)) {
                socket.emit('error', {
                    message: 'Rate limit exceeded. Please slow down.',
                    code: 'RATE_LIMIT_EXCEEDED'
                });
                return;
            }
            const validatedData = sendMessageSchema.parse(data);
            const { conversationId, content } = validatedData;
            const cleanContent = this.profanityFilter.clean(content);
            logger_1.messageLogger.info('Message send attempt', {
                socketId: socket.id,
                userId: socket.data.userId,
                conversationId,
                contentLength: cleanContent.length
            });
            const hasAccess = await (0, auth_1.checkConversationAccess)(socket, conversationId);
            if (!hasAccess) {
                socket.emit('error', {
                    message: 'You do not have access to this conversation',
                    code: 'CONVERSATION_ACCESS_DENIED'
                });
                return;
            }
            const message = await database_1.databaseUtils.createMessage({
                content: cleanContent,
                conversationId,
                senderId: socket.data.userId
            });
            const isCreator = socket.data.userRole === 'CREATOR';
            const recipientId = isCreator
                ? message.conversation.fanId
                : message.conversation.creatorId;
            const messageData = {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                conversationId: message.conversationId,
                sender: {
                    id: message.sender.id,
                    name: message.sender.name,
                    avatarUrl: message.sender.profile?.avatarUrl || null
                },
                isFromCreator: isCreator,
                isRead: false
            };
            socket.emit('message_sent', messageData);
            const senderNewMessage = {
                ...messageData,
            };
            socket.emit('new_message', senderNewMessage);
            const unreadCount = await database_1.databaseUtils.getUnreadCount(conversationId, recipientId);
            const updateData = {
                type: 'conversation',
                id: conversationId,
                lastMessage: message.content,
                lastMessageTime: message.createdAt.toISOString(),
                unreadCount,
            };
            this.io.to(`user:${recipientId}`).emit('conversation_updated', updateData);
            const recipientSockets = await this.io.in(`user:${recipientId}`).fetchSockets();
            if (recipientSockets.length > 0) {
                const newMessageData = {
                    id: message.id,
                    content: message.content,
                    createdAt: message.createdAt,
                    conversationId: message.conversationId,
                    sender: {
                        id: message.sender.id,
                        name: message.sender.name,
                        avatarUrl: message.sender.profile?.avatarUrl || null
                    },
                    isFromCreator: isCreator,
                    isRead: false
                };
                this.io.to(`user:${recipientId}`).emit('new_message', newMessageData);
            }
            const conversationUpdate = {
                conversationId,
                lastMessage: {
                    content: message.content,
                    createdAt: message.createdAt,
                    isFromFan: !isCreator
                },
                lastMessageAt: message.createdAt
            };
            this.io.to(`user:${message.conversation.creatorId}`).emit('conversation_updated', conversationUpdate);
            this.io.to(`user:${message.conversation.fanId}`).emit('conversation_updated', conversationUpdate);
            logger_1.messageLogger.info('Message sent successfully', {
                messageId: message.id,
                senderId: socket.data.userId,
                recipientId,
                conversationId
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.errors.map(e => e.message).join(', ');
                socket.emit('error', {
                    message: errorMessage,
                    code: 'VALIDATION_ERROR'
                });
                logger_1.messageLogger.warn('Message validation failed', {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    errors: error.errors
                });
            }
            else {
                socket.emit('error', {
                    message: 'Failed to send message. Please try again.',
                    code: 'MESSAGE_SEND_FAILED'
                });
                logger_1.messageLogger.error('Error sending message', {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                });
            }
        }
    }
    async handleJoinConversation(socket, data) {
        try {
            const validatedData = joinConversationSchema.parse(data);
            const { conversationId } = validatedData;
            const hasAccess = await (0, auth_1.checkConversationAccess)(socket, conversationId);
            if (!hasAccess) {
                socket.emit('error', {
                    message: 'You do not have access to this conversation',
                    code: 'CONVERSATION_ACCESS_DENIED'
                });
                return;
            }
            await socket.join(`conversation:${conversationId}`);
            await database_1.databaseUtils.markMessagesAsRead(conversationId, socket.data.userId);
            logger_1.messageLogger.info('User joined conversation', {
                socketId: socket.id,
                userId: socket.data.userId,
                conversationId
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.errors.map(e => e.message).join(', ');
                socket.emit('error', {
                    message: errorMessage,
                    code: 'VALIDATION_ERROR'
                });
            }
            else {
                socket.emit('error', {
                    message: 'Failed to join conversation',
                    code: 'JOIN_CONVERSATION_FAILED'
                });
                logger_1.messageLogger.error('Error joining conversation', {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async handleLeaveConversation(socket, data) {
        try {
            const validatedData = joinConversationSchema.parse(data);
            const { conversationId } = validatedData;
            await socket.leave(`conversation:${conversationId}`);
            logger_1.messageLogger.info('User left conversation', {
                socketId: socket.id,
                userId: socket.data.userId,
                conversationId
            });
        }
        catch (error) {
            logger_1.messageLogger.error('Error leaving conversation', {
                socketId: socket.id,
                userId: socket.data.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleTypingStart(socket, data) {
        try {
            const validatedData = joinConversationSchema.parse(data);
            const { conversationId } = validatedData;
            if (!(0, auth_1.checkRateLimit)(`${socket.id}:typing`, 30, 60000)) {
                return;
            }
            const hasAccess = await (0, auth_1.checkConversationAccess)(socket, conversationId);
            if (!hasAccess)
                return;
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                conversationId,
                userId: socket.data.userId,
                userName: socket.data.userName
            });
        }
        catch (error) {
            logger_1.messageLogger.debug('Typing start error', {
                socketId: socket.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleTypingStop(socket, data) {
        try {
            const validatedData = joinConversationSchema.parse(data);
            const { conversationId } = validatedData;
            const hasAccess = await (0, auth_1.checkConversationAccess)(socket, conversationId);
            if (!hasAccess)
                return;
            socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
                conversationId,
                userId: socket.data.userId
            });
        }
        catch (error) {
            logger_1.messageLogger.debug('Typing stop error', {
                socketId: socket.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleMarkAsRead(socket, data) {
        try {
            const validatedData = markAsReadSchema.parse(data);
            const { type, id } = validatedData;
            const { userId } = socket.data;
            if (type === 'conversation') {
                await database_1.databaseUtils.markConversationAsRead(id, userId);
            }
            else {
                await database_1.databaseUtils.markCommunityAsRead(id, userId);
            }
            socket.emit('messages_read_update', { type, id });
            logger_1.messageLogger.info(`'${type}' marked as read`, {
                socketId: socket.id,
                userId,
                id,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.errors.map(e => e.message).join(', ');
                socket.emit('error', {
                    message: errorMessage,
                    code: 'VALIDATION_ERROR'
                });
            }
            else {
                socket.emit('error', {
                    message: 'Failed to mark messages as read',
                    code: 'MARK_MESSAGES_READ_FAILED'
                });
                logger_1.messageLogger.error('Error marking messages as read', {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async handleSendCommunityMessage(socket, data) {
        try {
            if (!(0, auth_1.checkRateLimit)(`${socket.id}:community`, 20, 60000)) {
                socket.emit('error', {
                    message: 'Rate limit exceeded for community messages.',
                    code: 'COMMUNITY_RATE_LIMIT_EXCEEDED'
                });
                return;
            }
            const validatedData = sendCommunityMessageSchema.parse(data);
            const { communityId, content } = validatedData;
            const { userId } = socket.data;
            const cleanContent = this.profanityFilter.clean(content);
            const member = await database_1.databaseUtils.getCommunityMembership(communityId, userId);
            if (!member) {
                socket.emit('error', {
                    message: 'You are not a member of this community',
                    code: 'COMMUNITY_ACCESS_DENIED',
                });
                return;
            }
            const message = await database_1.databaseUtils.createCommunityMessage({
                content: cleanContent,
                communityId,
                senderId: userId,
            });
            this.io.to(`community:${communityId}`).emit('new_message', message);
            this.io.to(`community:${communityId}`).emit('conversation_updated', {
                id: communityId,
                type: 'community',
                lastMessage: message,
            });
            logger_1.messageLogger.info('Community message sent', {
                socketId: socket.id,
                userId,
                communityId,
                messageId: message.id,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                socket.emit('error', { message: 'Invalid message data', code: 'VALIDATION_ERROR', details: error.errors });
            }
            else {
                logger_1.messageLogger.error('Error sending community message', {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                socket.emit('error', { message: 'Failed to send message', code: 'SERVER_ERROR' });
            }
        }
    }
    async handleCommunityTypingStart(socket, data) {
        try {
            const validatedData = communityTypingSchema.parse(data);
            const { communityId } = validatedData;
            if (!(0, auth_1.checkRateLimit)(`${socket.id}:community:typing`, 30, 60000)) {
                return;
            }
            const membership = await database_1.databaseUtils.getCommunityMembership(communityId, socket.data.userId);
            if (!membership)
                return;
            socket.to(`community:${communityId}`).emit('community_user_typing', {
                communityId,
                userId: socket.data.userId,
                userName: socket.data.userName
            });
        }
        catch (error) {
            logger_1.messageLogger.debug('Community typing start error', {
                socketId: socket.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleCommunityTypingStop(socket, data) {
        try {
            const validatedData = communityTypingSchema.parse(data);
            const { communityId } = validatedData;
            const membership = await database_1.databaseUtils.getCommunityMembership(communityId, socket.data.userId);
            if (!membership)
                return;
            socket.to(`community:${communityId}`).emit('community_user_stopped_typing', {
                communityId,
                userId: socket.data.userId
            });
        }
        catch (error) {
            logger_1.messageLogger.debug('Community typing stop error', {
                socketId: socket.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.MessageHandler = MessageHandler;
//# sourceMappingURL=messageHandler.js.map