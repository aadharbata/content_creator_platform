// types/index.ts
import { types as mediasoupTypes } from 'mediasoup';

export interface StreamInfo {
  id: string;
  title: string;
  broadcasterName: string;
  broadcasterId: string;
  isActive: boolean;
  startTime: Date;
  viewers: Set<string>;
  producers: Map<string, mediasoupTypes.Producer>;
  producerTransport?: mediasoupTypes.WebRtcTransport;
  chatUsers: Map<string, ChatUser>; // socketId -> ChatUser
  chatMessages: ChatMessage[];
}

export interface StreamListItem {
  id: string;
  title: string;
  broadcasterName: string;
  startTime: Date;
  viewerCount: number;
}

export interface CreateStreamData {
  title: string;
  broadcasterName: string;
}

export interface MediaTransportConfig {
  maxIncomingBitrate: number;
  initialAvailableOutgoingBitrate: number;
  listenIps: { ip: string; announcedIp: string }[];
  enableUdp: boolean;
  enableTcp: boolean;
  preferUdp: boolean;
}

// Chat-related types
export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system' | 'moderator' | 'warning';
  originalMessage?: string; // Store original message if profanity was filtered
  isFiltered?: boolean; // Flag to indicate if message was filtered for profanity
}

export interface ChatUser {
  socketId: string;
  username: string;
  userId?: string;
  isModerator: boolean;
  isStreamer: boolean;
  joinedAt: Date;
}

export interface SendMessageData {
  streamId: string;
  message: string;
  username: string;
  userId?: string;
}

export interface JoinChatData {
  streamId: string;
  username: string;
  userId?: string;
}
