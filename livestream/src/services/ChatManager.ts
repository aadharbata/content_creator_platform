// services/ChatManager.ts
import { ChatMessage, ChatUser, SendMessageData, JoinChatData } from '../types';
import { StreamManager } from './StreamManager';
import Filter from 'bad-words';

export class ChatManager {
  private messageHistory = new Map<string, ChatMessage[]>(); // streamId -> messages
  private readonly MAX_MESSAGES_PER_STREAM = 100;
  private messageCounter = 0; // Add counter for uniqueness
  private rateLimitMap = new Map<string, { count: number; lastReset: number }>(); // socketId -> rate limit info
  private readonly RATE_LIMIT_WINDOW = 10000; // 10 seconds
  private readonly RATE_LIMIT_MAX_MESSAGES = 5; // 5 messages per window
  private profanityFilter: Filter;
  private userWarnings = new Map<string, { count: number; lastWarning: number }>(); // socketId -> warning info
  private readonly WARNING_RESET_TIME = 300000; // 5 minutes
  private readonly MAX_WARNINGS_BEFORE_TIMEOUT = 3;

  constructor(private streamManager: StreamManager) {
    // Initialize profanity filter
    this.profanityFilter = new Filter();
    
    // Add custom words if needed (optional)
    // this.profanityFilter.addWords('customword1', 'customword2');
    
    // Remove words from filter if needed (optional)
    // this.profanityFilter.removeWords('word1', 'word2');
  }

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

  sendMessage(socketId: string, data: SendMessageData): { success: boolean; message?: ChatMessage; error?: string; warning?: ChatMessage; warningCount?: number } {
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
        // Check if user is timed out due to excessive profanity warnings
        if (this.isUserTimedOut(socketId)) {
          const warningInfo = this.userWarnings.get(socketId);
          const timeRemaining = warningInfo ? Math.ceil((this.WARNING_RESET_TIME - (Date.now() - warningInfo.lastWarning)) / 60000) : 0;
          return { success: false, error: `You are temporarily blocked from sending messages due to excessive inappropriate language. Time remaining: ${timeRemaining} minutes.` };
        }

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

      const originalMessage = data.message.trim();
      let filteredMessage = originalMessage;
      let isFiltered = false;
      let warningMessage: ChatMessage | undefined;

      // Check for profanity (moderators are exempt from filtering)
      if (!user.isModerator) {
        const hasProfanity = this.profanityFilter.isProfane(originalMessage);
        
        if (hasProfanity) {
          // Filter the message
          filteredMessage = this.profanityFilter.clean(originalMessage);
          isFiltered = true;

          // Track warnings for this user
          const warningInfo = this.trackUserWarning(socketId);
          
          // Create warning message for the sender
          warningMessage = {
            id: this.generateMessageId(),
            streamId: data.streamId,
            userId: 'system',
            username: 'System',
            message: `Warning: Your message contained inappropriate language and has been filtered. Warning ${warningInfo.count}/${this.MAX_WARNINGS_BEFORE_TIMEOUT}. ${warningInfo.count >= this.MAX_WARNINGS_BEFORE_TIMEOUT ? 'You have reached the maximum number of warnings.' : `${this.MAX_WARNINGS_BEFORE_TIMEOUT - warningInfo.count} warnings remaining.`}`,
            timestamp: new Date(),
            type: 'warning'
          };

          console.log(`Profanity detected from user ${user.username} (${socketId}): "${originalMessage}" -> "${filteredMessage}"`);
          
          // Store the warning count for returning
          const currentWarningCount = warningInfo.count;
          
          const message: ChatMessage = {
            id: this.generateMessageId(),
            streamId: data.streamId,
            userId: user.userId || socketId,
            username: user.username,
            message: filteredMessage,
            timestamp: new Date(),
            type: user.isModerator ? 'moderator' : 'message',
            originalMessage: isFiltered ? originalMessage : undefined,
            isFiltered
          };

          this.addMessage(data.streamId, message);

          return { success: true, message, warning: warningMessage, warningCount: currentWarningCount };
        }
      }

      const message: ChatMessage = {
        id: this.generateMessageId(),
        streamId: data.streamId,
        userId: user.userId || socketId,
        username: user.username,
        message: filteredMessage,
        timestamp: new Date(),
        type: user.isModerator ? 'moderator' : 'message',
        originalMessage: isFiltered ? originalMessage : undefined,
        isFiltered
      };

      this.addMessage(data.streamId, message);

      return { success: true, message, warning: warningMessage, warningCount: warningMessage ? 1 : 0 };
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
    this.userWarnings.delete(socketId);
  }

  private trackUserWarning(socketId: string): { count: number; isMaxReached: boolean } {
    const now = Date.now();
    const warningInfo = this.userWarnings.get(socketId);

    if (!warningInfo) {
      // First warning for this user
      this.userWarnings.set(socketId, { count: 1, lastWarning: now });
      return { count: 1, isMaxReached: false };
    }

    // Check if we need to reset the warning count (after WARNING_RESET_TIME)
    if (now - warningInfo.lastWarning >= this.WARNING_RESET_TIME) {
      warningInfo.count = 1;
      warningInfo.lastWarning = now;
      return { count: 1, isMaxReached: false };
    }

    // Increment warning count
    warningInfo.count++;
    warningInfo.lastWarning = now;
    
    const isMaxReached = warningInfo.count >= this.MAX_WARNINGS_BEFORE_TIMEOUT;
    
    return { count: warningInfo.count, isMaxReached };
  }

  getUserWarningCount(socketId: string): number {
    const warningInfo = this.userWarnings.get(socketId);
    if (!warningInfo) return 0;

    const now = Date.now();
    // Reset count if warning period has expired
    if (now - warningInfo.lastWarning >= this.WARNING_RESET_TIME) {
      this.userWarnings.delete(socketId);
      return 0;
    }

    return warningInfo.count;
  }

  isUserTimedOut(socketId: string): boolean {
    const warningInfo = this.userWarnings.get(socketId);
    if (!warningInfo) return false;

    const now = Date.now();
    // If warning period has expired, user is no longer timed out
    if (now - warningInfo.lastWarning >= this.WARNING_RESET_TIME) {
      this.userWarnings.delete(socketId);
      return false;
    }

    return warningInfo.count >= this.MAX_WARNINGS_BEFORE_TIMEOUT;
  }
}
