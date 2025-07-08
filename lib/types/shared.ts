// Shared types for consistent data structures across dashboard and WebSocket

import { Community as PrismaCommunity, Conversation as PrismaConversation, Message, User } from '@/lib/generated/prisma';

export interface DashboardMessage {
  id: string
  content: string
  createdAt: string  // Dashboard uses strings for dates
  isRead: boolean
  sender: {
    id: string
    name: string
    avatarUrl: string | null
  }
  isFromCreator: boolean
}

export interface DashboardConversation {
  id: string
  fan: {
    id: string
    name: string
    avatarUrl: string | null
  }
  lastMessage: {
    content: string
    createdAt: string  // Dashboard uses strings for dates
    isFromFan: boolean
  } | null
  unreadCount: number
  lastMessageAt: string  // Dashboard uses strings for dates
}

// Utility functions for converting between WebSocket (Date) and Dashboard (string) formats
export const convertWebSocketToDashboard = {
  message: (wsMessage: any): DashboardMessage => ({
    id: wsMessage.id,
    content: wsMessage.content,
    createdAt: wsMessage.createdAt instanceof Date 
      ? wsMessage.createdAt.toISOString() 
      : wsMessage.createdAt,
    isRead: wsMessage.isRead || false,
    sender: {
      id: wsMessage.sender.id,
      name: wsMessage.sender.name,
      avatarUrl: wsMessage.sender.avatarUrl || null
    },
    isFromCreator: wsMessage.isFromCreator || false
  }),

  conversationUpdate: (wsUpdate: any) => ({
    lastMessage: wsUpdate.lastMessage ? {
      content: wsUpdate.lastMessage.content,
      createdAt: wsUpdate.lastMessage.createdAt instanceof Date 
        ? wsUpdate.lastMessage.createdAt.toISOString() 
        : wsUpdate.lastMessage.createdAt,
      isFromFan: wsUpdate.lastMessage.isFromFan
    } : null,
    lastMessageAt: wsUpdate.lastMessageAt instanceof Date 
      ? wsUpdate.lastMessageAt.toISOString() 
      : wsUpdate.lastMessageAt
  })
}

// Type guards for runtime validation
export const isValidMessage = (obj: any): obj is DashboardMessage => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.isRead === 'boolean' &&
    typeof obj.isFromCreator === 'boolean' &&
    obj.sender &&
    typeof obj.sender.id === 'string' &&
    typeof obj.sender.name === 'string'
}

export const isValidConversation = (obj: any): obj is DashboardConversation => {
  return obj &&
    typeof obj.id === 'string' &&
    obj.fan &&
    typeof obj.fan.id === 'string' &&
    typeof obj.fan.name === 'string' &&
    typeof obj.unreadCount === 'number' &&
    typeof obj.lastMessageAt === 'string'
} 

export type MessageWithSender = Message & {
  sender: { id: string; name: string; image?: string | null };
  conversationId?: string;
  communityId?: string;
};

export type Conversation = PrismaConversation & {
  lastMessage?: MessageWithSender;
  otherUser: { id: string; name: string; image?: string | null };
  unreadCount: number;
  placeholder?: boolean;
};

export type Community = PrismaCommunity & {
  lastMessage?: MessageWithSender;
  unreadCount: number;
  imageUrl?: string | null;
  _count: {
    members: number;
  };
};

export type ChatListItem =
  | (Conversation & { type: 'conversation' })
  | (Community & { type: 'community' }); 