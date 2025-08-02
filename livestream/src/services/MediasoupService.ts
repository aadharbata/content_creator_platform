// services/MediasoupService.ts
import * as mediasoup from 'mediasoup';
import { types as mediasoupTypes } from 'mediasoup';
import { MEDIA_CODECS, TRANSPORT_CONFIG } from '../config/media';

export class MediasoupService {
  private worker?: mediasoupTypes.Worker;
  private router?: mediasoupTypes.Router;

  async initialize(): Promise<void> {
    this.worker = await mediasoup.createWorker({
      logLevel: 'warn',
    });

    this.worker.on('died', () => {
      console.error('mediasoup worker has died');
      setTimeout(() => process.exit(1), 2000);
    });

    this.router = await this.worker.createRouter({ 
      mediaCodecs: MEDIA_CODECS 
    });
  }

  getRouter(): mediasoupTypes.Router {
    if (!this.router) {
      throw new Error('Router not initialized');
    }
    return this.router;
  }

  getWorker(): mediasoupTypes.Worker {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }
    return this.worker;
  }

  async createWebRtcTransport(): Promise<mediasoupTypes.WebRtcTransport> {
    if (!this.router) {
      throw new Error('Router not initialized');
    }

    const transport = await this.router.createWebRtcTransport({
      listenIps: TRANSPORT_CONFIG.listenIps,
      enableUdp: TRANSPORT_CONFIG.enableUdp,
      enableTcp: TRANSPORT_CONFIG.enableTcp,
      preferUdp: TRANSPORT_CONFIG.preferUdp,
      initialAvailableOutgoingBitrate: TRANSPORT_CONFIG.initialAvailableOutgoingBitrate,
    });

    transport.setMaxIncomingBitrate(TRANSPORT_CONFIG.maxIncomingBitrate);
    
    return transport;
  }
}
