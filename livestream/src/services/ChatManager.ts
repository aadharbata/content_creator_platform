// services/ChatManager.ts
import { ChatMessage, ChatUser, SendMessageData, JoinChatData } from '../types';
import { StreamManager } from './StreamManager';

export class ChatManager {
  private messageHistory = new Map<string, ChatMessage[]>(); // streamId -> messages
  private readonly MAX_MESSAGES_PER_STREAM = 100;
  private messageCounter = 0; // Add counter for uniqueness
  private rateLimitMap = new Map<string, { count: number; lastReset: number }>(); // socketId -> rate limit info
  private readonly RATE_LIMIT_WINDOW = 10000; // 10 seconds
  private readonly RATE_LIMIT_MAX_MESSAGES = 5; // 5 messages per window

  constructor(private streamManager: StreamManager) {}

  joinChat(socketId: string, data: JoinChatData): { success: boolean; user?: ChatUser; error?: string } {
    try {
      const stream = this.streamManager.getStream(data.streamId);
      if (!stream) {
        return { success: false, error: 'Stream not found' };
      }

      // Check if user is already in chat
      if (stream.chatUsers.has(socketId)) {
        return { success: false, error: 'Already in chat' };
      }

      const isStreamer = stream.broadcasterId === socketId;
      const user: ChatUser = {
        socketId,
        username: data.username,
        userId: data.userId,
        isModerator: isStreamer, // Stream creator is a moderator
        isStreamer,
        joinedAt: new Date()
      };

      stream.chatUsers.set(socketId, user);

      // Add system message about user joining
      const joinMessage: ChatMessage = {
        id: this.generateMessageId(),
        streamId: data.streamId,
        userId: 'system',
        username: 'System',
        message: `${data.username} joined the chat`,
        timestamp: new Date(),
        type: 'system'
      };

      this.addMessage(data.streamId, joinMessage);

      return { success: true, user };
    } catch (error) {
      console.error('Error joining chat:', error);
      return { success: false, error: 'Failed to join chat' };
    }
  }

  leaveChat(socketId: string, streamId: string): { success: boolean; username?: string } {
    try {
      const stream = this.streamManager.getStream(streamId);
      if (!stream || !stream.chatUsers.has(socketId)) {
        return { success: false };
      }

      const user = stream.chatUsers.get(socketId)!;
      stream.chatUsers.delete(socketId);

      // Add system message about user leaving
      const leaveMessage: ChatMessage = {
        id: this.generateMessageId(),
        streamId,
        userId: 'system',
        username: 'System',
        message: `${user.username} left the chat`,
        timestamp: new Date(),
        type: 'system'
      };

      this.addMessage(streamId, leaveMessage);

      return { success: true, username: user.username };
    } catch (error) {
      console.error('Error leaving chat:', error);
      return { success: false };
    }
  }

  sendMessage(socketId: string, data: SendMessageData): { success: boolean; message?: ChatMessage; error?: string } {
    try {
      const stream = this.streamManager.getStream(data.streamId);
      if (!stream) {
        return { success: false, error: 'Stream not found' };
      }

      const user = stream.chatUsers.get(socketId);
      if (!user) {
        return { success: false, error: 'Not in chat' };
      }

      // Check rate limiting (moderators are exempt)
      if (!user.isModerator) {
        const rateLimitCheck = this.checkRateLimit(socketId);
        if (!rateLimitCheck.allowed) {
          return { success: false, error: `Rate limit exceeded. Please wait ${Math.ceil(rateLimitCheck.waitTime / 1000)} seconds.` };
        }
      }

      // Validate message
      if (!data.message || data.message.trim().length === 0) {
        return { success: false, error: 'Message cannot be empty' };
      }

      if (data.message.length > 500) {
        return { success: false, error: 'Message too long' };
      }

      const message: ChatMessage = {
        id: this.generateMessageId(),
        streamId: data.streamId,
        userId: user.userId || socketId,
        username: user.username,
        message: data.message.trim(),
        timestamp: new Date(),
        type: user.isModerator ? 'moderator' : 'message'
      };

      this.addMessage(data.streamId, message);

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  getChatHistory(streamId: string): ChatMessage[] {
    return this.messageHistory.get(streamId) || [];
  }

  getChatUsers(streamId: string): ChatUser[] {
    const stream = this.streamManager.getStream(streamId);
    if (!stream) return [];
    
    return Array.from(stream.chatUsers.values());
  }

  removeUserFromAllChats(socketId: string): string[] {
    const affectedStreams: string[] = [];
    
    // Find all streams where this user is in chat
    const allStreams = this.streamManager.getAllStreams();
    
    for (const stream of allStreams) {
      if (stream.chatUsers.has(socketId)) {
        this.leaveChat(socketId, stream.id);
        affectedStreams.push(stream.id);
      }
    }

    // Clean up rate limiting for this user
    this.cleanupRateLimit(socketId);

    return affectedStreams;
  }

  clearChatHistory(streamId: string): boolean {
    try {
      this.messageHistory.delete(streamId);
      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  }

  private addMessage(streamId: string, message: ChatMessage): void {
    if (!this.messageHistory.has(streamId)) {
      this.messageHistory.set(streamId, []);
    }

    const messages = this.messageHistory.get(streamId)!;
    messages.push(message);

    // Also add to stream's message history
    const stream = this.streamManager.getStream(streamId);
    if (stream) {
      stream.chatMessages.push(message);
      
      // Keep only the last MAX_MESSAGES_PER_STREAM messages
      if (stream.chatMessages.length > this.MAX_MESSAGES_PER_STREAM) {
        stream.chatMessages = stream.chatMessages.slice(-this.MAX_MESSAGES_PER_STREAM);
      }
    }

    // Keep only the last MAX_MESSAGES_PER_STREAM messages in main history
    if (messages.length > this.MAX_MESSAGES_PER_STREAM) {
      messages.splice(0, messages.length - this.MAX_MESSAGES_PER_STREAM);
    }
  }

  private generateMessageId(): string {
    // Use counter + timestamp + random for guaranteed uniqueness
    this.messageCounter++;
    return `msg_${Date.now()}_${this.messageCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkRateLimit(socketId: string): { allowed: boolean; waitTime: number } {
    const now = Date.now();
    const rateLimitInfo = this.rateLimitMap.get(socketId);

    if (!rateLimitInfo) {
      // First message from this user
      this.rateLimitMap.set(socketId, { count: 1, lastReset: now });
      return { allowed: true, waitTime: 0 };
    }

    // Check if we need to reset the window
    if (now - rateLimitInfo.lastReset >= this.RATE_LIMIT_WINDOW) {
      rateLimitInfo.count = 1;
      rateLimitInfo.lastReset = now;
      return { allowed: true, waitTime: 0 };
    }

    // Check if user has exceeded rate limit
    if (rateLimitInfo.count >= this.RATE_LIMIT_MAX_MESSAGES) {
      const waitTime = this.RATE_LIMIT_WINDOW - (now - rateLimitInfo.lastReset);
      return { allowed: false, waitTime };
    }

    // Allow message and increment counter
    rateLimitInfo.count++;
    return { allowed: true, waitTime: 0 };
  }

  // Clean up rate limit data for disconnected users
  cleanupRateLimit(socketId: string): void {
    this.rateLimitMap.delete(socketId);
  }
}
