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
  CommunityNewMessageData,
  ConversationUpdateData
} from '../types/events'
// Profanity filtering
import Filter from 'bad-words'

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
  type: z.enum(['conversation', 'community']),
  id: process.env.NODE_ENV === 'development'
    ? z.string().min(1, 'ID cannot be empty')
    : z.string().uuid('Invalid ID format'),
})

// Community validation schemas
const sendCommunityMessageSchema = z.object({
  communityId: process.env.NODE_ENV === 'development' 
    ? z.string().min(1, 'Community ID cannot be empty')
    : z.string().uuid('Invalid community ID format'),
  content: z.string().min(1, 'Message content cannot be empty').max(500, 'Message is too long'),
})

const communityTypingSchema = z.object({
  communityId: process.env.NODE_ENV === 'development'
    ? z.string().min(1, 'Community ID cannot be empty') 
    : z.string().uuid('Invalid community ID format')
})

export class MessageHandler {
  private profanityFilter: Filter

  constructor(private io: Server) {
    // Initialize profanity filter once per handler instance
    this.profanityFilter = new Filter()
  }

  // Auto-join user to their community rooms on connection
  async handleAutoJoinCommunities(socket: AuthenticatedSocket): Promise<void> {
    try {
      // DEVELOPMENT MODE: Skip database lookup
      if (process.env.NODE_ENV === 'development') {
        messageLogger.info('Skipping auto-join communities in development mode', {
          socketId: socket.id,
          userId: socket.data.userId
        })
        return;
      }

      // PRODUCTION MODE: Get user's community memberships from database
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

      // Sanitize message content
      const cleanContent = this.profanityFilter.clean(content)
      
      // Check if content was sanitized and notify user
      if (content !== cleanContent) {
        socket.emit('system_message', {
          type: 'moderation_warning',
          message: 'Your message contained inappropriate content and has been modified to comply with community guidelines.',
          timestamp: new Date()
        })
        
        messageLogger.info('Profanity detected and sanitized', {
          socketId: socket.id,
          userId: socket.data.userId,
          conversationId,
          originalLength: content.length,
          cleanedLength: cleanContent.length
        })
      }

      messageLogger.info('Message send attempt', {
        socketId: socket.id,
        userId: socket.data.userId,
        conversationId,
        contentLength: cleanContent.length
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
        content: cleanContent,
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
        content: message.content, // already clean
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

      // Also send the same new_message event to the sender for immediate UI update
      const senderNewMessage: NewMessageData = {
        ...messageData,
      };
      socket.emit('new_message', senderNewMessage);

      // Get the new unread count for the recipient
      const unreadCount = await databaseUtils.getUnreadCount(
        conversationId,
        recipientId
      );

      // Emit a conversation_updated event to the recipient
      const updateData: ConversationUpdateData = {
        type: 'conversation',
        id: conversationId,
        lastMessage: message.content,
        lastMessageTime: message.createdAt.toISOString(),
        unreadCount,
      };
      this.io.to(`user:${recipientId}`).emit('conversation_updated', updateData);

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

  // Handle marking messages as read for both conversations and communities
  async handleMarkAsRead(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = markAsReadSchema.parse(data);
      const { type, id } = validatedData;
      const { userId } = socket.data;

      if (type === 'conversation') {
        await databaseUtils.markConversationAsRead(id, userId);
      } else { // type === 'community'
        await databaseUtils.markCommunityAsRead(id, userId);
      }
      
      // Confirm back to the user that the action was successful
      socket.emit('messages_read_update', { type, id });

      messageLogger.info(`'${type}' marked as read`, {
        socketId: socket.id,
        userId,
        id,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => e.message).join(', ')
        socket.emit('error', { 
          message: errorMessage,
          code: 'VALIDATION_ERROR'
        })
      } else {
        socket.emit('error', { 
          message: 'Failed to mark messages as read',
          code: 'MARK_MESSAGES_READ_FAILED'
        })
        messageLogger.error('Error marking messages as read', {
          socketId: socket.id,
          userId: socket.data.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  // Community message handling methods
  async handleSendCommunityMessage(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      if (!checkRateLimit(`${socket.id}:community`, 20, 60000)) { // 20 messages per minute
        socket.emit('error', { 
          message: 'Rate limit exceeded for community messages.',
          code: 'COMMUNITY_RATE_LIMIT_EXCEEDED'
        });
        return;
      }

      const validatedData = sendCommunityMessageSchema.parse(data);
      const { communityId, content } = validatedData;
      const { userId } = socket.data;

      // Sanitize community message content
      const cleanContent = this.profanityFilter.clean(content)
      
      // Check if content was sanitized and notify user
      if (content !== cleanContent) {
        socket.emit('system_message', {
          type: 'moderation_warning',
          message: 'Your message contained inappropriate content and has been modified to comply with community guidelines.',
          timestamp: new Date()
        })
        
        messageLogger.info('Community profanity detected and sanitized', {
          socketId: socket.id,
          userId,
          communityId,
          originalLength: content.length,
          cleanedLength: cleanContent.length
        })
      }

      // DEVELOPMENT MODE: Skip database checks and create mock message
      if (process.env.NODE_ENV === 'development') {
        const message = {
          id: `dev-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: cleanContent,
          createdAt: new Date(),
          senderId: userId,
          communityId: communityId,
          sender: {
            id: userId,
            name: socket.data.userName,
            avatarUrl: null
          }
        };

        // Broadcast the new message to all members of the community room using community-specific event
        this.io.to(`community:${communityId}`).emit('community_new_message', message);

        messageLogger.info('Community message sent (development mode)', {
          socketId: socket.id,
          userId,
          communityId,
          messageId: message.id,
        });
        return;
      }

      // PRODUCTION MODE: Full database validation
      // Security check: ensure user is a member of the community
      const member = await databaseUtils.getCommunityMembership(communityId, userId);
      if (!member) {
        socket.emit('error', {
          message: 'You are not a member of this community',
          code: 'COMMUNITY_ACCESS_DENIED',
        });
        return;
      }

      // Create the message in the database
      const message = await databaseUtils.createCommunityMessage({
        content: cleanContent,
        communityId,
        senderId: userId,
      });

      // Broadcast the new message to all members of the community room using community-specific event
      this.io.to(`community:${communityId}`).emit('community_new_message', message);

      // Trigger a conversation update for all members for sorting/unread counts
      this.io.to(`community:${communityId}`).emit('conversation_updated', {
        id: communityId,
        type: 'community',
        lastMessage: message,
      });

      messageLogger.info('Community message sent', {
        socketId: socket.id,
        userId,
        communityId,
        messageId: message.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        socket.emit('error', { message: 'Invalid message data', code: 'VALIDATION_ERROR', details: error.errors });
      } else {
        messageLogger.error('Error sending community message', {
          socketId: socket.id,
          userId: socket.data.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        socket.emit('error', { message: 'Failed to send message', code: 'SERVER_ERROR' });
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

      // DEVELOPMENT MODE: Skip database membership check
      if (process.env.NODE_ENV === 'development') {
        // Broadcast typing to other community members
        socket.to(`community:${communityId}`).emit('community_user_typing', {
          communityId,
          userId: socket.data.userId,
          userName: socket.data.userName
        })
        return;
      }

      // PRODUCTION MODE: Check membership
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

      // DEVELOPMENT MODE: Skip database membership check
      if (process.env.NODE_ENV === 'development') {
        // Broadcast stop typing to other community members
        socket.to(`community:${communityId}`).emit('community_user_stopped_typing', {
          communityId,
          userId: socket.data.userId
        })
        return;
      }

      // PRODUCTION MODE: Check membership
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

  // Handle joining a specific community
  async handleJoinCommunity(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = communityTypingSchema.parse(data) // Use same schema as it validates communityId
      const { communityId } = validatedData

      // DEVELOPMENT MODE: Allow joining any community without validation
      if (process.env.NODE_ENV === 'development') {
        await socket.join(`community:${communityId}`)
        
        messageLogger.info('User joined community (development mode)', {
          socketId: socket.id,
          userId: socket.data.userId,
          communityId
        })

        // Send confirmation to the user
        socket.emit('community_joined', {
          communityId,
          message: `Successfully joined community ${communityId}`
        })
        return;
      }

      // PRODUCTION MODE: Validate membership
      const membership = await databaseUtils.getCommunityMembership(communityId, socket.data.userId)
      if (!membership) {
        socket.emit('error', {
          message: 'You are not a member of this community',
          code: 'COMMUNITY_ACCESS_DENIED'
        })
        return
      }

      await socket.join(`community:${communityId}`)
      
      messageLogger.info('User joined community', {
        socketId: socket.id,
        userId: socket.data.userId,
        communityId
      })

      // Send confirmation to the user
      socket.emit('community_joined', {
        communityId,
        message: `Successfully joined community ${communityId}`
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
          message: 'Failed to join community',
          code: 'JOIN_COMMUNITY_FAILED'
        })
        messageLogger.error('Error joining community', {
          socketId: socket.id,
          userId: socket.data.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  // Handle leaving a specific community
  async handleLeaveCommunity(socket: AuthenticatedSocket, data: unknown): Promise<void> {
    try {
      const validatedData = communityTypingSchema.parse(data)
      const { communityId } = validatedData

      await socket.leave(`community:${communityId}`)

      messageLogger.info('User left community', {
        socketId: socket.id,
        userId: socket.data.userId,
        communityId
      })

      // Send confirmation to the user
      socket.emit('community_left', {
        communityId,
        message: `Left community ${communityId}`
      })

    } catch (error) {
      messageLogger.error('Error leaving community', {
        socketId: socket.id,
        userId: socket.data.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

} 