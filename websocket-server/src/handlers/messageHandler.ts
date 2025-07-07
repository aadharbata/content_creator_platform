import { Server } from 'socket.io'
import { z } from 'zod'
import { AuthenticatedSocket, checkConversationAccess, checkRateLimit } from '../middleware/auth'
import { databaseUtils } from '../utils/database'
import { messageLogger } from '../utils/logger'
import {
  MessageSentData,
  NewMessageData,
  ConversationUpdatedData,
  CommunityMessageSentData,
  CommunityNewMessageData
} from '../types/events'

// Validation schemas
const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format'),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long (max 1000 characters)')
    .transform(str => str.trim())
})

const joinConversationSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format')
})

const markAsReadSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format'),
  messageIds: z.array(z.string().uuid()).optional()
})

// Community validation schemas
const sendCommunityMessageSchema = z.object({
  communityId: z.string().uuid('Invalid community ID format'),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 characters)')
    .transform(str => str.trim())
})

const communityTypingSchema = z.object({
  communityId: z.string().uuid('Invalid community ID format')
})

export class MessageHandler {
  constructor(private io: Server) {}

  // Auto-join user to their community rooms on connection
  async handleAutoJoinCommunities(socket: AuthenticatedSocket): Promise<void> {
    try {
      const memberships = await databaseUtils.getUserCommunityMemberships(socket.data.userId)
      
      for (const membership of memberships) {
        await socket.join(`community:${membership.communityId}`)
      }

      messageLogger.info('User auto-joined communities', {
        socketId: socket.id,
        userId: socket.data.userId,
        communitiesJoined: memberships.length
      })

    } catch (error) {
      messageLogger.error('Error auto-joining communities', {
        socketId: socket.id,
        userId: socket.data.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle sending a new message
  async handleSendMessage(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      // Rate limiting
      if (!checkRateLimit(socket.id, 10, 60000)) { // 10 messages per minute
        socket.emit('error', { 
          message: 'Rate limit exceeded. Please slow down.',
          code: 'RATE_LIMIT_EXCEEDED'
        })
        return
      }

      // Validate input data
      const validatedData = sendMessageSchema.parse(data)
      const { conversationId, content } = validatedData

      messageLogger.info('Message send attempt', {
        socketId: socket.id,
        userId: socket.data.userId,
        conversationId,
        contentLength: content.length
      })

      // Check conversation access
      const hasAccess = await checkConversationAccess(socket, conversationId)
      if (!hasAccess) {
        socket.emit('error', { 
          message: 'You do not have access to this conversation',
          code: 'CONVERSATION_ACCESS_DENIED'
        })
        return
      }

      // Create message in database
      const message = await databaseUtils.createMessage({
        content,
        conversationId,
        senderId: socket.data.userId
      })

      // Determine recipient
      const isCreator = socket.data.userRole === 'CREATOR'
      const recipientId = isCreator 
        ? message.conversation.fanId 
        : message.conversation.creatorId

      // Format message data
      const messageData: MessageSentData = {
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
        isRead: false  // New messages are unread by default
      }

      // Send confirmation to sender
      socket.emit('message_sent', messageData)

      // Send message to recipient if they're online
      const recipientSockets = await this.io.in(`user:${recipientId}`).fetchSockets()
      if (recipientSockets.length > 0) {
        const newMessageData: NewMessageData = {
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
          isRead: false  // New messages are unread by default
        }
        
        this.io.to(`user:${recipientId}`).emit('new_message', newMessageData)
      }

      // Update conversation for both users
      const conversationUpdate: ConversationUpdatedData = {
        conversationId,
        lastMessage: {
          content: message.content,
          createdAt: message.createdAt,
          isFromFan: !isCreator
        },
        lastMessageAt: message.createdAt
      }

      // Send to both creator and fan rooms
      this.io.to(`user:${message.conversation.creatorId}`).emit('conversation_updated', conversationUpdate)
      this.io.to(`user:${message.conversation.fanId}`).emit('conversation_updated', conversationUpdate)

      messageLogger.info('Message sent successfully', {
        messageId: message.id,
        senderId: socket.data.userId,
        recipientId,
        conversationId
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => e.message).join(', ')
        socket.emit('error', { 
          message: errorMessage,
          code: 'VALIDATION_ERROR'
        })
        messageLogger.warn('Message validation failed', {
          socketId: socket.id,
          userId: socket.data.userId,
          errors: error.errors
        })
      } else {
        socket.emit('error', { 
          message: 'Failed to send message. Please try again.',
          code: 'MESSAGE_SEND_FAILED'
        })
        messageLogger.error('Error sending message', {
          socketId: socket.id,
          userId: socket.data.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }
  }

  // Handle joining a conversation room
  async handleJoinConversation(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = joinConversationSchema.parse(data)
      const { conversationId } = validatedData

      // Check conversation access
      const hasAccess = await checkConversationAccess(socket, conversationId)
      if (!hasAccess) {
        socket.emit('error', { 
          message: 'You do not have access to this conversation',
          code: 'CONVERSATION_ACCESS_DENIED'
        })
        return
      }

      // Join the conversation room
      await socket.join(`conversation:${conversationId}`)

      // Mark messages as read when joining
      await databaseUtils.markMessagesAsRead(conversationId, socket.data.userId)

      messageLogger.info('User joined conversation', {
        socketId: socket.id,
        userId: socket.data.userId,
        conversationId
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => e.message).join(', ')
        socket.emit('error', { 
          message: errorMessage,
          code: 'VALIDATION_ERROR'
        })
      } else {
        socket.emit('error', { 
          message: 'Failed to join conversation',
          code: 'JOIN_CONVERSATION_FAILED'
        })
        messageLogger.error('Error joining conversation', {
          socketId: socket.id,
          userId: socket.data.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  // Handle leaving a conversation room
  async handleLeaveConversation(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = joinConversationSchema.parse(data)
      const { conversationId } = validatedData

      // Leave the conversation room
      await socket.leave(`conversation:${conversationId}`)

      messageLogger.info('User left conversation', {
        socketId: socket.id,
        userId: socket.data.userId,
        conversationId
      })

    } catch (error) {
      messageLogger.error('Error leaving conversation', {
        socketId: socket.id,
        userId: socket.data.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle typing indicators
  async handleTypingStart(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = joinConversationSchema.parse(data)
      const { conversationId } = validatedData

      // Rate limiting for typing events (more lenient)
      if (!checkRateLimit(`${socket.id}:typing`, 30, 60000)) { // 30 typing events per minute
        return
      }

      const hasAccess = await checkConversationAccess(socket, conversationId)
      if (!hasAccess) return

      // Broadcast typing to other users in the conversation
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.data.userId,
        userName: socket.data.userName
      })

    } catch (error) {
      // Silently fail for typing events to avoid spam
      messageLogger.debug('Typing start error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async handleTypingStop(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = joinConversationSchema.parse(data)
      const { conversationId } = validatedData

      const hasAccess = await checkConversationAccess(socket, conversationId)
      if (!hasAccess) return

      // Broadcast stop typing to other users in the conversation
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        conversationId,
        userId: socket.data.userId
      })

    } catch (error) {
      messageLogger.debug('Typing stop error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle marking messages as read
  async handleMarkAsRead(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = markAsReadSchema.parse(data)
      const { conversationId } = validatedData

      const hasAccess = await checkConversationAccess(socket, conversationId)
      if (!hasAccess) {
        socket.emit('error', { 
          message: 'You do not have access to this conversation',
          code: 'CONVERSATION_ACCESS_DENIED'
        })
        return
      }

      // Mark messages as read and get the conversation details
      const updateResult = await databaseUtils.markMessagesAsRead(conversationId, socket.data.userId)
      
      // Get updated conversation for unread count
      const conversation = await databaseUtils.getConversationWithAccess(conversationId, socket.data.userId)
      if (conversation) {
        // Get unread count for creator
        const creatorUnreadCount = await databaseUtils.getUnreadCount(conversationId, conversation.creatorId)
        // Get unread count for fan  
        const fanUnreadCount = await databaseUtils.getUnreadCount(conversationId, conversation.fanId)
        
        // Send read status update to creator
        const creatorReadUpdate = {
          conversationId,
          readByUserId: socket.data.userId,
          unreadCount: creatorUnreadCount,
          timestamp: new Date()
        }
        this.io.to(`user:${conversation.creatorId}`).emit('messages_read_update', creatorReadUpdate)
        
        // Send read status update to fan
        const fanReadUpdate = {
          conversationId,
          readByUserId: socket.data.userId,
          unreadCount: fanUnreadCount,
          timestamp: new Date()
        }
        this.io.to(`user:${conversation.fanId}`).emit('messages_read_update', fanReadUpdate)
      }

      messageLogger.debug('Messages marked as read', {
        socketId: socket.id,
        userId: socket.data.userId,
        conversationId,
        messagesUpdated: updateResult.count
      })

    } catch (error) {
      messageLogger.error('Error marking messages as read', {
        socketId: socket.id,
        userId: socket.data.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Community message handling methods
  async handleSendCommunityMessage(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      // Rate limiting for community messages
      if (!checkRateLimit(`${socket.id}:community`, 20, 60000)) { // 20 messages per minute
        socket.emit('error', { 
          message: 'Rate limit exceeded for community messages.',
          code: 'COMMUNITY_RATE_LIMIT_EXCEEDED'
        })
        return
      }

      const validatedData = sendCommunityMessageSchema.parse(data)
      const { communityId, content } = validatedData

      // Check if user is a member of the community
      const membership = await databaseUtils.getCommunityMembership(communityId, socket.data.userId)
      if (!membership) {
        socket.emit('error', { 
          message: 'You are not a member of this community',
          code: 'COMMUNITY_ACCESS_DENIED'
        })
        return
      }

      // Get community conversation
      const community = await databaseUtils.getCommunityWithConversation(communityId)
      if (!community?.conversation) {
        socket.emit('error', { 
          message: 'Community conversation not found',
          code: 'COMMUNITY_CONVERSATION_NOT_FOUND'
        })
        return
      }

      // Create message in database
      const message = await databaseUtils.createCommunityMessage({
        content,
        conversationId: community.conversation.id,
        senderId: socket.data.userId
      })

      // Format message data
      const messageData: CommunityMessageSentData = {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        conversationId: message.conversationId,
        communityId,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          avatarUrl: message.sender.profile?.avatarUrl || null
        }
      }

      // Send confirmation to sender
      socket.emit('community_message_sent', messageData)

      // Broadcast to all community members (except sender)
      const communityNewMessageData: CommunityNewMessageData = {
        ...messageData
      }
      
      socket.to(`community:${communityId}`).emit('community_new_message', communityNewMessageData)

      messageLogger.info('Community message sent', {
        messageId: message.id,
        senderId: socket.data.userId,
        communityId
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => e.message).join(', ')
        socket.emit('error', { 
          message: errorMessage,
          code: 'VALIDATION_ERROR'
        })
      } else {
        socket.emit('error', { 
          message: 'Failed to send community message',
          code: 'COMMUNITY_MESSAGE_SEND_FAILED'
        })
        messageLogger.error('Error sending community message', {
          socketId: socket.id,
          userId: socket.data.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  async handleCommunityTypingStart(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = communityTypingSchema.parse(data)
      const { communityId } = validatedData

      // Rate limiting for typing events
      if (!checkRateLimit(`${socket.id}:community:typing`, 30, 60000)) {
        return
      }

      const membership = await databaseUtils.getCommunityMembership(communityId, socket.data.userId)
      if (!membership) return

      // Broadcast typing to other community members
      socket.to(`community:${communityId}`).emit('community_user_typing', {
        communityId,
        userId: socket.data.userId,
        userName: socket.data.userName
      })

    } catch (error) {
      messageLogger.debug('Community typing start error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async handleCommunityTypingStop(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = communityTypingSchema.parse(data)
      const { communityId } = validatedData

      const membership = await databaseUtils.getCommunityMembership(communityId, socket.data.userId)
      if (!membership) return

      // Broadcast stop typing to other community members
      socket.to(`community:${communityId}`).emit('community_user_stopped_typing', {
        communityId,
        userId: socket.data.userId
      })

    } catch (error) {
      messageLogger.debug('Community typing stop error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

} 