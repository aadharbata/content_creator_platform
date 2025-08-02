// config/media.ts
import { types as mediasoupTypes } from 'mediasoup';
import { MediaTransportConfig } from '../types';

// Codec = COder + DECoder
export const MEDIA_CODECS: mediasoupTypes.RouterRtpCodecCapability[] = [
  {
    kind: 'audio' as mediasoupTypes.MediaKind,
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video' as mediasoupTypes.MediaKind,
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

export const TRANSPORT_CONFIG: MediaTransportConfig = {
  maxIncomingBitrate: 1500000,
  initialAvailableOutgoingBitrate: 1000000,
  listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
};

export const SERVER_CONFIG = {
  port: 4000,
  cors: {
    origin: '*',
  },
  mediasoup: {
    logLevel: 'warn' as const,
  },
};
