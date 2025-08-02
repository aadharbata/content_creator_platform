// services/TransportManager.ts
import { types as mediasoupTypes } from 'mediasoup';

export class TransportManager {
  private transports = new Map<string, mediasoupTypes.WebRtcTransport>();
  private consumers = new Map<string, mediasoupTypes.Consumer[]>();

  addTransport(transportId: string, transport: mediasoupTypes.WebRtcTransport): void {
    this.transports.set(transportId, transport);
  }

  getTransport(transportId: string): mediasoupTypes.WebRtcTransport | undefined {
    return this.transports.get(transportId);
  }

  removeTransport(transportId: string): void {
    const transport = this.transports.get(transportId);
    if (transport) {
      // Close all consumers for this transport
      const transportConsumers = this.consumers.get(transportId);
      if (transportConsumers) {
        transportConsumers.forEach(consumer => consumer.close());
        this.consumers.delete(transportId);
      }
      
      // Close and remove the transport
      transport.close();
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
      consumer.close();
      this.removeConsumer(transportId, consumer);
    });

    consumer.on('producerclose', () => {
      console.log(`Producer closed for consumer ${consumer.id} (${consumer.kind})`);
      consumer.close();
      this.removeConsumer(transportId, consumer);
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
}
