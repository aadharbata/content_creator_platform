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
    socket.on('connectConsumerTransport', async ({ transportId, dtlsParameters }, callback) => {
      try {
        const consumerTransport = this.transportManager.getTransport(transportId);

        if (!consumerTransport) {
          console.error(`Transport with id "${transportId}" not found`);
          callback({ error: `Transport with id "${transportId}" not found` });
          return;
        }

        await consumerTransport.connect({ dtlsParameters });
        console.log(`Consumer transport ${transportId} connected successfully`);
        callback();
      } catch (error) {
        console.error('Error connecting consumer transport:', error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleConsume(socket: Socket): void {
    socket.on('consume', async ({ streamId, transportId, rtpCapabilities }, callback) => {
      try {
        console.log(`Consume request for stream ${streamId}, transport ${transportId}`);
        
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
          console.error(`No producers available for stream ${streamId}`);
          callback({ error: 'No producers available for this stream' });
          return;
        }
        
        console.log(`Found ${stream.producers.size} producers for stream ${streamId}:`, 
          Array.from(stream.producers.entries()).map(([id, p]) => `${id}(${p.kind})`));
        
        const consumerTransport = this.transportManager.getTransport(transportId);
  
        if (!consumerTransport) {
          console.error(`Transport ${transportId} not found`);
          callback({ error: `Transport with id "${transportId}" not found` });
          return;
        }

        const router = this.mediasoupService.getRouter();

        // Consume all available producers (video and audio) for this stream
        const consumeResults = [];
        
        for (const [producerId, producer] of stream.producers) {
          console.log(`Checking if can consume producer ${producerId} (${producer.kind})`);
          
          // Check if producer is still valid
          if (producer.closed) {
            console.warn(`Producer ${producerId} is closed, skipping`);
            continue;
          }
          
          if (router.canConsume({ producerId, rtpCapabilities })) {
            console.log(`Creating consumer for producer ${producerId} (${producer.kind})`);
            
            try {
              const consumer = await consumerTransport.consume({
                producerId,
                rtpCapabilities,
                paused: true,
              });

              // Store the consumer
              this.transportManager.addConsumer(transportId, consumer);

              consumeResults.push({
                id: consumer.id,
                producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
              });
              
              console.log(`Consumer created: ${consumer.id} for ${producer.kind}`);
            } catch (consumerError) {
              console.error(`Error creating consumer for producer ${producerId}:`, consumerError);
              // Continue with other producers even if one fails
            }
          } else {
            console.warn(`Cannot consume producer ${producerId} (${producer.kind}) - RTP capabilities mismatch`);
          }
        }

        console.log(`Created ${consumeResults.length} consumers for stream ${streamId}`);
        
        if (consumeResults.length === 0) {
          callback({ error: 'No consumers could be created for this stream' });
          return;
        }
        
        // Return all consumers created
        callback(consumeResults);
      } catch (error) {
        console.error('Error in handleConsume:', error);
        callback({ error: (error as Error).message });
      }
    });
  }

  handleResume(socket: Socket): void {
    socket.on('resume', async ({ transportId }, callback) => {
      try {
        console.log(`Resume request for transport ${transportId}`);
        
        const consumerTransport = this.transportManager.getTransport(transportId);

        if (!consumerTransport) {
          console.error(`Transport ${transportId} not found for resume`);
          if (callback && typeof callback === 'function') {
            callback({ error: `Transport with id "${transportId}" not found` });
          }
          return;
        }

        const transportConsumers = this.transportManager.getConsumers(transportId);
        if (transportConsumers && transportConsumers.length > 0) {
          // Resume all consumers for this transport
          for (const consumer of transportConsumers) {
            if (consumer.paused) {
              await consumer.resume();
              console.log(`Resumed consumer ${consumer.id} (${consumer.kind})`);
            } else {
              console.log(`Consumer ${consumer.id} (${consumer.kind}) was already resumed`);
            }
          }
          console.log(`Successfully resumed ${transportConsumers.length} consumers for transport ${transportId}`);
        } else {
          console.warn(`No consumers found for transport ${transportId}`);
        }
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      } catch (error) {
        console.error('Error in resume:', error);
        if (callback && typeof callback === 'function') {
          callback({ error: (error as Error).message });
        }
      }
    });
  }
}
