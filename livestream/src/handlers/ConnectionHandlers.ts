// handlers/ConnectionHandlers.ts
import { Socket, Server } from 'socket.io';
import { StreamManager } from '../services/StreamManager';
import { TransportManager } from '../services/TransportManager';
import { ChatManager } from '../services/ChatManager';

export class ConnectionHandlers {
  constructor(
    private streamManager: StreamManager,
    private transportManager: TransportManager,
    private io: Server,
    private chatManager?: ChatManager
  ) {}

  handleConnection(socket: Socket): Set<string> {
    console.log('User connected:', socket.id);
    
    // Track transports created by this socket
    const socketTransports = new Set<string>();

    // Send current streams to new user
    try {
      const activeStreams = this.streamManager.getActiveStreams();
      socket.emit('availableStreams', activeStreams);
    } catch (error) {
      console.error('Error sending available streams:', error);
    }

    return socketTransports;
  }

  handleDisconnection(socket: Socket, socketTransports: Set<string>): void {
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Check if user was a broadcaster
      const endedStreamId = this.streamManager.handleBroadcasterDisconnect(socket.id);
      
      if (endedStreamId) {
        // Cleanup stream transports
        this.transportManager.cleanupStreamTransports(endedStreamId);
        
        // Notify all users
        this.io.emit('streamEnded', endedStreamId);
        this.io.emit('availableStreams', this.streamManager.getActiveStreams());
        console.log(`Stream ${endedStreamId} ended due to broadcaster disconnect`);
      } else {
        // Check if user was a viewer and remove from all streams
        const updatedStreamIds = this.streamManager.handleViewerDisconnect(socket.id);
        
        if (updatedStreamIds.length > 0) {
          // Emit viewer count updates
          updatedStreamIds.forEach(streamId => {
            const stream = this.streamManager.getStream(streamId);
            if (stream) {
              this.io.emit('streamViewerCount', { streamId, count: stream.viewers.size });
            }
          });
          
          // Emit updated available streams
          this.io.emit('availableStreams', this.streamManager.getActiveStreams());
        }
      }
      
      // Handle chat disconnection if chatManager is available
      if (this.chatManager) {
        const affectedStreams = this.chatManager.removeUserFromAllChats(socket.id);
        
        // Notify all affected chat rooms
        affectedStreams.forEach(streamId => {
          const chatUsers = this.chatManager!.getChatUsers(streamId);
          socket.to(`stream:${streamId}:chat`).emit('userLeftChat', {
            chatUsers
          });

          // Broadcast the leave message if there is one
          const recentMessages = this.chatManager!.getChatHistory(streamId);
          if (recentMessages.length > 0) {
            const lastMessage = recentMessages[recentMessages.length - 1];
            if (lastMessage.type === 'system' && lastMessage.message.includes('left the chat')) {
              this.io.to(`stream:${streamId}:chat`).emit('newChatMessage', {
                message: lastMessage
              });
            }
          }
        });
      }
      
      // Clean up transports and consumers created by this socket
      this.transportManager.cleanupSocketTransports(socketTransports);
    });
  }
}
