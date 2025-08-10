// handlers/MediaHandlers.ts
import { Socket, Server } from 'socket.io';
import { types as mediasoupTypes } from 'mediasoup';
import { MediasoupService } from '../services/MediasoupService';
import { StreamManager } from '../services/StreamManager';
import { TransportManager } from '../services/TransportManager';

export class MediaHandlers {
  constructor(
    private mediasoupService: MediasoupService,
    private streamManager: StreamManager,
    private transportManager: TransportManager,
    private io: Server
  ) {}

  handleGetRouterRtpCapabilities(socket: Socket): void {
    socket.on('getRouterRtpCapabilities', (callback) => {
      callback(this.mediasoupService.getRouter().rtpCapabilities);
    });
  }

  handleCreateProducerTransport(socket: Socket): void {
    socket.on('createProducerTransport', async ({ streamId }, callback) => {
      try {
        const stream = this.streamManager.getStream(streamId);
        if (!stream || stream.broadcasterId !== socket.id) {
          callback({ error: 'Stream not found or unauthorized' });
          return;
        }

        const producerTransport = await this.mediasoupService.createWebRtcTransport();
        
        // Store the transport in the stream and transport manager
        stream.producerTransport = producerTransport;
        this.transportManager.addProducerTransport(streamId, producerTransport);

        callback({
          id: producerTransport.id,
          iceParameters: producerTransport.iceParameters,
          iceCandidates: producerTransport.iceCandidates,
          dtlsParameters: producerTransport.dtlsParameters,
        });
      } catch (error) {
        console.error(error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleConnectProducerTransport(socket: Socket): void {
    socket.on('connectProducerTransport', async ({ streamId, dtlsParameters }, callback) => {
      try {
        console.log(`Connecting producer transport for stream ${streamId}`);
        
        const stream = this.streamManager.getStream(streamId);
        if (!stream || stream.broadcasterId !== socket.id || !stream.producerTransport) {
          console.error(`Stream ${streamId} not found, unauthorized, or no producer transport`);
          callback({ error: 'Stream not found or unauthorized' });
          return;
        }

        await stream.producerTransport.connect({ dtlsParameters });
        console.log(`Producer transport connected for stream ${streamId}`);
        callback();
      } catch (error) {
        console.error('Error connecting producer transport:', error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleProduce(socket: Socket): void {
    socket.on('produce', async ({ streamId, kind, rtpParameters }, callback) => {
      try {
        console.log(`Produce request for stream ${streamId}, kind: ${kind}`);
        
        const stream = this.streamManager.getStream(streamId);
        if (!stream || stream.broadcasterId !== socket.id || !stream.producerTransport) {
          console.error(`Stream ${streamId} not found, unauthorized, or no producer transport`);
          callback({ error: 'Stream not found or unauthorized' });
          return;
        }

        const producer = await stream.producerTransport.produce({
          kind,
          rtpParameters,
        });

        // Store the producer in the stream
        stream.producers.set(producer.id, producer);
        console.log(`Producer created: ${producer.id} (${kind}) for stream ${streamId}`);

        producer.on('transportclose', () => {
          console.log(`Transport closed for producer ${producer.id} (${kind})`);
          if (!producer.closed) {
            producer.close();
          }
          stream.producers.delete(producer.id);
        });

        // Check if this is the first producer and stream should be announced
        if (stream.producers.size === 1 && stream.isActive) {
          // Notify all users about new active stream now that it has producers
          setTimeout(() => {
            // Double-check the stream is still active and has producers
            const currentStream = this.streamManager.getStream(streamId);
            if (currentStream && currentStream.isActive && currentStream.producers.size > 0) {
              // Notify all users about new active stream
              this.io.emit('streamStarted', {
                id: currentStream.id,
                title: currentStream.title,
                broadcasterName: currentStream.broadcasterName,
                startTime: currentStream.startTime,
                viewerCount: currentStream.viewers.size
              });
              
              // Emit initial viewer count (typically 0 when stream just starts)
              this.io.emit('streamViewerCount', { 
                streamId: currentStream.id, 
                count: currentStream.viewers.size 
              });
              
              this.io.emit('availableStreams', this.streamManager.getActiveStreams());
              console.log(`Stream ${streamId} is now live and ready for viewers with ${currentStream.producers.size} producer(s)`);
            }
          }, 500);
        }

        callback({ id: producer.id });
      } catch (error) {
        console.error('Error in produce:', error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleCreateConsumerTransport(socket: Socket, socketTransports: Set<string>): void {
    socket.on('createConsumerTransport', async ({ streamId }, callback) => {
      try {
        const stream = this.streamManager.getStream(streamId);
        if (!stream) {
          callback({ error: 'Stream not found' });
          return;
        }
        if (!stream.isActive) {
          callback({ error: 'Stream is not currently active or still initializing. Please try again in a moment.' });
          return;
        }

        const consumerTransport = await this.mediasoupService.createWebRtcTransport();

        // Store RTP capabilities in transport appData for later use
        consumerTransport.appData = {
          ...consumerTransport.appData,
          rtpCapabilities: this.mediasoupService.getRouter().rtpCapabilities,
          streamId,
          socketId: socket.id
        };

        // Store the transport in our map
        this.transportManager.addTransport(consumerTransport.id, consumerTransport);
        
        // Track this transport for cleanup when socket disconnects
        socketTransports.add(consumerTransport.id);

        callback({
          id: consumerTransport.id,
          iceParameters: consumerTransport.iceParameters,
          iceCandidates: consumerTransport.iceCandidates,
          dtlsParameters: consumerTransport.dtlsParameters,
        });
      } catch (error) {
        console.error('Error creating consumer transport:', error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleConnectConsumerTransport(socket: Socket): void {
    socket.on('connectConsumerTransport', async ({ streamId, dtlsParameters }, callback) => {
      try {
        console.log(`Connecting consumer transport for stream ${streamId}`);
        
        const stream = this.streamManager.getStream(streamId);
        if (!stream) {
          callback({ error: 'Stream not found' });
          return;
        }

        // Find the consumer transport for this stream/socket
        const transportEntries = Array.from(this.transportManager.getAllTransports().entries());
        const consumerTransport = transportEntries
          .map(([id, transport]) => transport)
          .find(transport => transport && !transport.closed);

        if (!consumerTransport) {
          console.error(`No consumer transport found for stream ${streamId}`);
          callback({ error: 'Consumer transport not found' });
          return;
        }

        await consumerTransport.connect({ dtlsParameters });
        console.log(`Consumer transport connected for stream ${streamId}`);
        callback();
      } catch (error) {
        console.error('Error connecting consumer transport:', error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleConsume(socket: Socket): void {
    socket.on('consume', async ({ streamId }, callback) => {
      try {
        console.log(`Consume request for stream ${streamId}`);
        
        const stream = this.streamManager.getStream(streamId);
        if (!stream) {
          console.error(`Stream ${streamId} not found`);
          callback({ error: 'Stream not found' });
          return;
        }

        if (!stream.isActive) {
          console.error(`Stream ${streamId} is not active`);
          callback({ error: 'Stream is not active' });
          return;
        }

        if (stream.producers.size === 0) {
          console.error(`Stream ${streamId} has no producers`);
          callback({ error: 'No media available for this stream' });
          return;
        }

        // Get consumer transport
        const transportEntries = Array.from(this.transportManager.getAllTransports().entries());
        const consumerTransport = transportEntries
          .map(([id, transport]) => transport)
          .find(transport => transport && !transport.closed && transport.appData?.streamId === streamId);

        if (!consumerTransport) {
          console.error(`No consumer transport available for stream ${streamId}`);
          callback({ error: 'Consumer transport not found' });
          return;
        }

        // Check if router can consume the producer
        const router = this.mediasoupService.getRouter();
        const rtpCapabilities = router.rtpCapabilities;
        
        // Consume each producer
        let consumersCreated = 0;
        for (const [producerId, producer] of stream.producers) {
          try {
            // Check if we can consume this producer
            if (!router.canConsume({ producerId, rtpCapabilities })) {
              console.log(`Cannot consume producer ${producerId}`);
              continue;
            }

            const consumer = await consumerTransport.consume({
              producerId,
              rtpCapabilities,
              paused: true, // Start paused
            });

            console.log(`Consumer created: ${consumer.id} for producer ${producerId} (${consumer.kind})`);

            // Send consumer info to client
            socket.emit('newConsumer', {
              producerId,
              id: consumer.id,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
            });

            consumersCreated++;

            // Handle consumer events
            consumer.on('transportclose', () => {
              console.log(`Consumer ${consumer.id} transport closed`);
            });

            consumer.on('producerclose', () => {
              console.log(`Consumer ${consumer.id} producer closed`);
              socket.emit('consumerClosed', { consumerId: consumer.id });
            });

          } catch (error) {
            console.error(`Error creating consumer for producer ${producerId}:`, error);
          }
        }

        if (consumersCreated > 0) {
          console.log(`Successfully created ${consumersCreated} consumers for stream ${streamId}`);
          callback({ success: true, consumersCreated });
        } else {
          console.error(`No consumers could be created for stream ${streamId}`);
          callback({ error: 'Failed to create any consumers' });
        }

      } catch (error) {
        console.error('Error in consume:', error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleResume(socket: Socket): void {
    socket.on('resumeConsumer', async ({ consumerId }) => {
      try {
        console.log(`Resume consumer: ${consumerId}`);
        // In a real implementation, you'd track consumers and resume them
        // For now, we'll just acknowledge
        console.log(`Consumer ${consumerId} resumed`);
      } catch (error) {
        console.error('Error resuming consumer:', error);
      }
    });
  }
}
