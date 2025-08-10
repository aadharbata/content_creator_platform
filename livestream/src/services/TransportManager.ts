// services/TransportManager.ts
import { types as mediasoupTypes } from 'mediasoup';

export class TransportManager {
  private transports = new Map<string, mediasoupTypes.WebRtcTransport>();
  private consumers = new Map<string, mediasoupTypes.Consumer[]>();
  private producerTransports = new Map<string, mediasoupTypes.WebRtcTransport>(); // streamId -> producer transport

  addTransport(transportId: string, transport: mediasoupTypes.WebRtcTransport): void {
    this.transports.set(transportId, transport);
    
    // Set up transport error handlers
    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'failed' || dtlsState === 'closed') {
        console.log(`Transport ${transportId} DTLS state changed to ${dtlsState}`);
        this.removeTransport(transportId);
      }
    });

    transport.on('icestatechange', (iceState) => {
      console.log(`Transport ${transportId} ICE state changed to ${iceState}`);
      if (iceState === 'closed') {
        this.removeTransport(transportId);
      }
    });
  }

  getTransport(transportId: string): mediasoupTypes.WebRtcTransport | undefined {
    return this.transports.get(transportId);
  }

  addProducerTransport(streamId: string, transport: mediasoupTypes.WebRtcTransport): void {
    this.producerTransports.set(streamId, transport);
    
    // Set up transport error handlers
    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'failed' || dtlsState === 'closed') {
        console.log(`Producer transport for stream ${streamId} DTLS state changed to ${dtlsState}`);
        this.removeProducerTransport(streamId);
      }
    });

    transport.on('icestatechange', (iceState) => {
      console.log(`Producer transport for stream ${streamId} ICE state changed to ${iceState}`);
      if (iceState === 'closed') {
        this.removeProducerTransport(streamId);
      }
    });
  }

  getProducerTransport(streamId: string): mediasoupTypes.WebRtcTransport | undefined {
    return this.producerTransports.get(streamId);
  }

  removeProducerTransport(streamId: string): void {
    const transport = this.producerTransports.get(streamId);
    if (transport && !transport.closed) {
      transport.close();
    }
    this.producerTransports.delete(streamId);
  }

  removeTransport(transportId: string): void {
    const transport = this.transports.get(transportId);
    if (transport) {
      // Close all consumers for this transport
      const transportConsumers = this.consumers.get(transportId);
      if (transportConsumers) {
        transportConsumers.forEach(consumer => {
          if (!consumer.closed) {
            consumer.close();
          }
        });
        this.consumers.delete(transportId);
      }
      
      // Close and remove the transport
      if (!transport.closed) {
        transport.close();
      }
      this.transports.delete(transportId);
    }
  }

  addConsumer(transportId: string, consumer: mediasoupTypes.Consumer): void {
    const transportConsumers = this.consumers.get(transportId) || [];
    transportConsumers.push(consumer);
    this.consumers.set(transportId, transportConsumers);
    
    console.log(`Added consumer ${consumer.id} (${consumer.kind}) to transport ${transportId}. Total consumers: ${transportConsumers.length}`);

    // Set up consumer event handlers
    consumer.on('transportclose', () => {
      console.log(`Transport closed for consumer ${consumer.id} (${consumer.kind})`);
      if (!consumer.closed) {
        consumer.close();
      }
      this.removeConsumer(transportId, consumer);
    });

    consumer.on('producerclose', () => {
      console.log(`Producer closed for consumer ${consumer.id} (${consumer.kind})`);
      if (!consumer.closed) {
        consumer.close();
      }
      this.removeConsumer(transportId, consumer);
    });

    consumer.on('producerpause', () => {
      console.log(`Producer paused for consumer ${consumer.id} (${consumer.kind})`);
    });

    consumer.on('producerresume', () => {
      console.log(`Producer resumed for consumer ${consumer.id} (${consumer.kind})`);
    });
  }

  private removeConsumer(transportId: string, consumer: mediasoupTypes.Consumer): void {
    const transportConsumers = this.consumers.get(transportId) || [];
    const index = transportConsumers.indexOf(consumer);
    if (index > -1) {
      transportConsumers.splice(index, 1);
      if (transportConsumers.length === 0) {
        this.consumers.delete(transportId);
      } else {
        this.consumers.set(transportId, transportConsumers);
      }
    }
  }

  getConsumers(transportId: string): mediasoupTypes.Consumer[] {
    return this.consumers.get(transportId) || [];
  }

  cleanupSocketTransports(transportIds: Set<string>): void {
    for (const transportId of transportIds) {
      this.removeTransport(transportId);
      console.log(`Cleaned up transport ${transportId} for disconnected socket`);
    }
  }

  cleanupStreamTransports(streamId: string): void {
    // Clean up producer transport for the stream
    this.removeProducerTransport(streamId);
    console.log(`Cleaned up producer transport for stream ${streamId}`);
  }

  getAllTransportIds(): string[] {
    return Array.from(this.transports.keys());
  }

  getAllTransports(): Map<string, mediasoupTypes.WebRtcTransport> {
    return this.transports;
  }

  getAllProducerTransportStreamIds(): string[] {
    return Array.from(this.producerTransports.keys());
  }
}
