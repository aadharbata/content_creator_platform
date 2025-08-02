// handlers/ConnectionHandlers.ts
import { Socket, Server } from 'socket.io';
import { StreamManager } from '../services/StreamManager';
import { TransportManager } from '../services/TransportManager';

export class ConnectionHandlers {
  constructor(
    private streamManager: StreamManager,
    private transportManager: TransportManager,
    private io: Server
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
      
      // Clean up transports and consumers created by this socket
      this.transportManager.cleanupSocketTransports(socketTransports);
    });
  }
}
