// handlers/StreamHandlers.ts
import { Socket, Server } from 'socket.io';
import { StreamManager } from '../services/StreamManager';

export class StreamHandlers {
  constructor(
    private streamManager: StreamManager,
    private io: Server
  ) {}

  handleCreateStream(socket: Socket): void {
    socket.on('createStream', ({ title, broadcasterName }, callback) => {
      try {
        const result = this.streamManager.createStream(socket.id, { title, broadcasterName });
        callback(result);
        console.log(`Stream created: ${result.streamId} by ${broadcasterName}`);
      } catch (error) {
        console.error('Error creating stream:', error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleStartStream(socket: Socket): void {
    socket.on('startStream', ({ streamId }) => {
      try {
        const stream = this.streamManager.startStream(streamId, socket.id);
        
        console.log(`Stream ${streamId} started by ${stream.broadcasterName}`);
        
        // Don't notify viewers immediately - wait for producers to be created
        // The notification will happen when the first producer is created in handleProduce
      } catch (error) {
        console.error('Error in startStream:', error);
        socket.emit('streamStartError', (error as Error).message);
      }
    });
  }

  handleStopStream(socket: Socket): void {
    socket.on('stopStream', ({ streamId }) => {
      try {
        this.streamManager.stopStream(streamId, socket.id);
        
        // Notify all users
        this.io.emit('streamEnded', streamId);
        this.io.emit('availableStreams', this.streamManager.getActiveStreams());
        
        console.log(`Stream ${streamId} stopped`);
      } catch (error) {
        console.error('Error in stopStream:', error);
        socket.emit('streamStopError', (error as Error).message);
      }
    });
  }

  handleJoinStream(socket: Socket): void {
    socket.on('joinStream', ({ streamId }) => {
      try {
        const stream = this.streamManager.joinStreamAsViewer(streamId, socket.id);
        
        // Emit viewer count update
        this.io.emit('streamViewerCount', { streamId, count: stream.viewers.size });
        
        // Also emit updated available streams to all users
        this.io.emit('availableStreams', this.streamManager.getActiveStreams());
        
        console.log(`Viewer ${socket.id} joined stream ${streamId}. Total viewers: ${stream.viewers.size}`);
      } catch (error) {
        console.error('Error in joinStream:', error);
        socket.emit('joinStreamError', (error as Error).message);
      }
    });
  }

  handleLeaveStream(socket: Socket): void {
    socket.on('leaveStream', ({ streamId }) => {
      try {
        const stream = this.streamManager.leaveStreamAsViewer(streamId, socket.id);
        
        if (stream) {
          // Emit viewer count update
          this.io.emit('streamViewerCount', { streamId, count: stream.viewers.size });
          
          // Also emit updated available streams to all users
          this.io.emit('availableStreams', this.streamManager.getActiveStreams());
          
          console.log(`Viewer ${socket.id} left stream ${streamId}. Total viewers: ${stream.viewers.size}`);
        }
      } catch (error) {
        console.error('Error in leaveStream:', error);
        socket.emit('leaveStreamError', (error as Error).message);
      }
    });
  }

  handleGetActiveStreams(socket: Socket): void {
    socket.on('getActiveStreams', (callback) => {
      const activeStreams = this.streamManager.getActiveStreams();
      console.log(`Sending ${activeStreams.length} active streams to client ${socket.id}`);
      callback(activeStreams);
    });
  }

  // Add debugging method
  handleGetStreamDebugInfo(socket: Socket): void {
    socket.on('getStreamDebugInfo', ({ streamId }, callback) => {
      const stream = this.streamManager.getStream(streamId);
      if (!stream) {
        callback({ error: 'Stream not found' });
        return;
      }
      
      const debugInfo = {
        id: stream.id,
        title: stream.title,
        isActive: stream.isActive,
        broadcasterId: stream.broadcasterId,
        viewerCount: stream.viewers.size,
        producerCount: stream.producers.size,
        producers: Array.from(stream.producers.entries()).map(([id, producer]) => ({
          id,
          kind: producer.kind,
          paused: producer.paused,
          closed: producer.closed
        }))
      };
      
      console.log('Stream debug info:', debugInfo);
      callback(debugInfo);
    });
  }
}
