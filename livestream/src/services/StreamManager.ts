// services/StreamManager.ts
import { StreamInfo, StreamListItem, CreateStreamData } from '../types';

export class StreamManager {
  private streams = new Map<string, StreamInfo>();
  private userStreams = new Map<string, string>(); // socketId -> streamId

  createStream(socketId: string, data: CreateStreamData): { streamId: string } {
    if (this.userStreams.has(socketId)) {
      throw new Error('You already have an active stream');
    }

    const streamId = this.generateStreamId();
    const stream: StreamInfo = {
      id: streamId,
      title: data.title || 'Untitled Stream',
      broadcasterName: data.broadcasterName || 'Anonymous',
      broadcasterId: socketId,
      isActive: false,
      startTime: new Date(),
      viewers: new Set(),
      producers: new Map(),
      chatUsers: new Map(),
      chatMessages: [],
    };

    this.streams.set(streamId, stream);
    this.userStreams.set(socketId, streamId);

    return { streamId };
  }

  getStream(streamId: string): StreamInfo | undefined {
    return this.streams.get(streamId);
  }

  getStreamByBroadcaster(socketId: string): StreamInfo | undefined {
    const streamId = this.userStreams.get(socketId);
    return streamId ? this.streams.get(streamId) : undefined;
  }

  startStream(streamId: string, socketId: string): StreamInfo {
    const stream = this.streams.get(streamId);
    if (!stream || stream.broadcasterId !== socketId) {
      throw new Error('Stream not found or unauthorized');
    }

    stream.isActive = true;
    stream.startTime = new Date();
    
    return stream;
  }

  stopStream(streamId: string, socketId: string): void {
    const stream = this.streams.get(streamId);
    if (!stream || stream.broadcasterId !== socketId) {
      throw new Error('Stream not found or unauthorized');
    }

    stream.isActive = false;
    stream.viewers.clear();
    
    // Close all producers
    stream.producers.forEach(producer => producer.close());
    stream.producers.clear();
    
    // Close producer transport
    if (stream.producerTransport) {
      stream.producerTransport.close();
      stream.producerTransport = undefined;
    }
    
    // Remove from maps
    this.streams.delete(streamId);
    this.userStreams.delete(socketId);
  }

  joinStreamAsViewer(streamId: string, viewerId: string): StreamInfo {
    const stream = this.streams.get(streamId);
    if (!stream || !stream.isActive) {
      throw new Error('Stream not available');
    }

    stream.viewers.add(viewerId);
    return stream;
  }

  leaveStreamAsViewer(streamId: string, viewerId: string): StreamInfo | undefined {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.viewers.delete(viewerId);
      return stream;
    }
    return undefined;
  }

  handleBroadcasterDisconnect(socketId: string): string | null {
    const streamId = this.userStreams.get(socketId);
    if (streamId) {
      const stream = this.streams.get(streamId);
      if (stream) {
        // End the stream
        stream.isActive = false;
        stream.viewers.clear();
        
        // Close all producers
        stream.producers.forEach(producer => producer.close());
        stream.producers.clear();
        
        // Close producer transport
        if (stream.producerTransport) {
          stream.producerTransport.close();
        }
        
        // Remove from maps
        this.streams.delete(streamId);
        this.userStreams.delete(socketId);
        
        return streamId;
      }
    }
    return null;
  }

  handleViewerDisconnect(socketId: string): string[] {
    const updatedStreams: string[] = [];
    
    this.streams.forEach((stream, streamId) => {
      if (stream.viewers.has(socketId)) {
        stream.viewers.delete(socketId);
        updatedStreams.push(streamId);
      }
    });
    
    return updatedStreams;
  }

  getActiveStreams(): StreamListItem[] {
    return Array.from(this.streams.values())
      .filter(stream => stream.isActive)
      .map(stream => ({
        id: stream.id,
        title: stream.title,
        broadcasterName: stream.broadcasterName,
        startTime: stream.startTime,
        viewerCount: stream.viewers.size
      }));
  }

  getAllStreams(): StreamInfo[] {
    return Array.from(this.streams.values());
  }

  private generateStreamId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
