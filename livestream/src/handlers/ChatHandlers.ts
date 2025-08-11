// handlers/ChatHandlers.ts
import { Socket, Server } from 'socket.io';
import { ChatManager } from '../services/ChatManager';
import { StreamManager } from '../services/StreamManager';

export class ChatHandlers {
  constructor(
    private chatManager: ChatManager,
    private streamManager: StreamManager,
    private io: Server
  ) {}

  handleJoinChat(socket: Socket): void {
    socket.on('joinChat', ({ streamId, username, userId }, callback) => {
      try {
        const result = this.chatManager.joinChat(socket.id, { streamId, username, userId });
        
        if (result.success && result.user) {
          // Join socket to stream room
          socket.join(`stream:${streamId}:chat`);
          
          // Get current chat users and recent messages
          const chatUsers = this.chatManager.getChatUsers(streamId);
          const recentMessages = this.chatManager.getChatHistory(streamId).slice(-50); // Last 50 messages
          
          // Send success response with chat data
          callback({
            success: true,
            user: result.user,
            chatUsers,
            recentMessages
          });

          // Notify other users in chat about new user
          socket.to(`stream:${streamId}:chat`).emit('userJoinedChat', {
            user: result.user,
            chatUsers
          });

          // Broadcast the join message
          this.io.to(`stream:${streamId}:chat`).emit('newChatMessage', {
            message: recentMessages[recentMessages.length - 1] // The system join message
          });

          console.log(`${username} joined chat for stream ${streamId}`);
        } else {
          callback({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('Error in joinChat:', error);
        callback({
          success: false,
          error: 'Failed to join chat'
        });
      }
    });
  }

  handleLeaveChat(socket: Socket): void {
    socket.on('leaveChat', ({ streamId }) => {
      try {
        const result = this.chatManager.leaveChat(socket.id, streamId);
        
        if (result.success) {
          // Leave socket room
          socket.leave(`stream:${streamId}:chat`);
          
          // Get updated chat users
          const chatUsers = this.chatManager.getChatUsers(streamId);
          
          // Notify other users in chat about user leaving
          socket.to(`stream:${streamId}:chat`).emit('userLeftChat', {
            username: result.username,
            chatUsers
          });

          // Broadcast the leave message
          const recentMessages = this.chatManager.getChatHistory(streamId);
          if (recentMessages.length > 0) {
            this.io.to(`stream:${streamId}:chat`).emit('newChatMessage', {
              message: recentMessages[recentMessages.length - 1] // The system leave message
            });
          }

          console.log(`${result.username} left chat for stream ${streamId}`);
        }
      } catch (error) {
        console.error('Error in leaveChat:', error);
      }
    });
  }

  handleSendMessage(socket: Socket): void {
    socket.on('sendChatMessage', ({ streamId, message, username, userId }, callback) => {
      try {
        const result = this.chatManager.sendMessage(socket.id, { streamId, message, username, userId });
        
        if (result.success && result.message) {
          // Broadcast message to all users in the chat
          this.io.to(`stream:${streamId}:chat`).emit('newChatMessage', {
            message: result.message
          });

          // If there's a warning, send it only to the sender
          if (result.warning) {
            socket.emit('profanityWarning', {
              message: result.warning.message,
              originalMessage: result.message.originalMessage,
              filteredMessage: result.message.message,
              warningCount: result.warningCount || 0,
              timestamp: new Date()
            });
          }

          callback({ 
            success: true, 
            message: result.message,
            hasWarning: !!result.warning,
            warning: result.warning 
          });
          
          console.log(`Message sent in stream ${streamId} by ${username}: ${message}${result.warning ? ' (filtered for profanity)' : ''}`);
        } else {
          // Check if this is a profanity-related error
          if (result.error && result.error.includes('inappropriate content')) {
            // Send warning directly to the sender
            socket.emit('profanityWarning', {
              message: result.error,
              warningCount: result.warningCount || 0,
              timestamp: new Date()
            });
            
            console.log(`Profanity warning sent to ${username} in stream ${streamId}: ${result.error}`);
          }
          
          // Check if user should be blocked
          if (result.error && result.error.includes('temporarily blocked')) {
            socket.emit('userBlocked', {
              message: result.error,
              blockDuration: 300, // 5 minutes in seconds
              timestamp: new Date()
            });
            
            console.log(`User ${username} blocked in stream ${streamId}: ${result.error}`);
          }
          
          callback({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('Error in sendChatMessage:', error);
        callback({
          success: false,
          error: 'Failed to send message'
        });
      }
    });
  }

  handleGetChatHistory(socket: Socket): void {
    socket.on('getChatHistory', ({ streamId }, callback) => {
      try {
        const stream = this.streamManager.getStream(streamId);
        if (!stream) {
          callback({ success: false, error: 'Stream not found' });
          return;
        }

        const messages = this.chatManager.getChatHistory(streamId);
        const users = this.chatManager.getChatUsers(streamId);
        
        callback({
          success: true,
          messages,
          users
        });
      } catch (error) {
        console.error('Error in getChatHistory:', error);
        callback({
          success: false,
          error: 'Failed to get chat history'
        });
      }
    });
  }

  handleGetChatUsers(socket: Socket): void {
    socket.on('getChatUsers', ({ streamId }, callback) => {
      try {
        const stream = this.streamManager.getStream(streamId);
        if (!stream) {
          callback({ success: false, error: 'Stream not found' });
          return;
        }

        const users = this.chatManager.getChatUsers(streamId);
        
        callback({
          success: true,
          users
        });
      } catch (error) {
        console.error('Error in getChatUsers:', error);
        callback({
          success: false,
          error: 'Failed to get chat users'
        });
      }
    });
  }

  handleTypingIndicator(socket: Socket): void {
    socket.on('chatTyping', ({ streamId, username, isTyping }) => {
      try {
        // Broadcast typing indicator to other users in chat
        socket.to(`stream:${streamId}:chat`).emit('userTyping', {
          username,
          isTyping
        });
      } catch (error) {
        console.error('Error in chatTyping:', error);
      }
    });
  }

  handleDisconnection(socket: Socket): void {
    // Remove user from all chats when they disconnect
    const affectedStreams = this.chatManager.removeUserFromAllChats(socket.id);
    
    // Notify all affected chat rooms
    affectedStreams.forEach(streamId => {
      const chatUsers = this.chatManager.getChatUsers(streamId);
      socket.to(`stream:${streamId}:chat`).emit('userLeftChat', {
        chatUsers
      });

      // Broadcast the leave message if there is one
      const recentMessages = this.chatManager.getChatHistory(streamId);
      if (recentMessages.length > 0) {
        const lastMessage = recentMessages[recentMessages.length - 1];
        if (lastMessage.type === 'system' && lastMessage.message.includes('left the chat')) {
          this.io.to(`stream:${streamId}:chat`).emit('newChatMessage', {
            message: lastMessage
          });
        }
      }
    });

    console.log(`Socket ${socket.id} disconnected from ${affectedStreams.length} chat rooms`);
  }

  // Moderator functions
  handleClearChat(socket: Socket): void {
    socket.on('clearChat', ({ streamId }, callback) => {
      try {
        const stream = this.streamManager.getStream(streamId);
        if (!stream) {
          callback({ success: false, error: 'Stream not found' });
          return;
        }

        // Check if user is a moderator (stream broadcaster)
        const user = stream.chatUsers.get(socket.id);
        if (!user || !user.isModerator) {
          callback({ success: false, error: 'Not authorized' });
          return;
        }

        const success = this.chatManager.clearChatHistory(streamId);
        
        if (success) {
          // Notify all users in chat that chat was cleared
          this.io.to(`stream:${streamId}:chat`).emit('chatCleared', {
            clearedBy: user.username
          });

          callback({ success: true });
          console.log(`Chat cleared for stream ${streamId} by ${user.username}`);
        } else {
          callback({ success: false, error: 'Failed to clear chat' });
        }
      } catch (error) {
        console.error('Error in clearChat:', error);
        callback({
          success: false,
          error: 'Failed to clear chat'
        });
      }
    });
  }

  handleGetUserWarningStatus(socket: Socket): void {
    socket.on('getUserWarningStatus', ({ streamId }, callback) => {
      try {
        const warningCount = this.chatManager.getUserWarningCount(socket.id);
        const isTimedOut = this.chatManager.isUserTimedOut(socket.id);
        
        callback({
          success: true,
          warningCount,
          isTimedOut,
          maxWarnings: 3 // This should match MAX_WARNINGS_BEFORE_TIMEOUT
        });
      } catch (error) {
        console.error('Error in getUserWarningStatus:', error);
        callback({
          success: false,
          error: 'Failed to get warning status'
        });
      }
    });
  }
}
