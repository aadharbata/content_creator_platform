export interface User {
  id: string
  name: string
  email: string
  role: 'CREATOR' | 'CONSUMER' | 'ADMIN'
  profile?: {
    avatarUrl?: string | null
  }
}

export interface Message {
  id: string
  content: string
  createdAt: Date
  isRead: boolean
  conversationId: string
  senderId: string
  sender: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export interface Conversation {
  id: string
  creatorId: string
  fanId: string
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CommunityConversation {
  id: string
  communityId: string
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface ConversationWithDetails extends Conversation {
  fan: {
    id: string
    name: string
    avatarUrl: string | null
  }
  creator: {
    id: string
    name: string
    avatarUrl: string | null
  }
  lastMessage?: {
    content: string
    createdAt: Date
    isFromFan: boolean
  }
  unreadCount: number
}

// Client to Server Events
export interface ClientToServerEvents {
  // Direct conversation events
  join_conversation: (data: { conversationId: string }) => void
  leave_conversation: (data: { conversationId: string }) => void
  send_message: (data: { conversationId: string; content: string }) => void
  typing_start: (data: { conversationId: string }) => void
  typing_stop: (data: { conversationId: string }) => void
  mark_as_read: (data: { type: 'conversation' | 'community', id: string }) => void
  
  // Community events  
  send_community_message: (data: { communityId: string; content: string }) => void
  community_typing_start: (data: { communityId: string }) => void
  community_typing_stop: (data: { communityId: string }) => void
  join_community: (data: { communityId: string }) => void
  leave_community: (data: { communityId: string }) => void
}

export interface SystemMessageData {
  type: 'moderation_warning' | 'info' | 'error' | 'success'
  message: string
  timestamp: Date
}

// Server to Client Events
export interface ServerToClientEvents {
  // Message events
  message_sent: (data: MessageSentData) => void
  new_message: (data: NewMessageData) => void
  message_error: (data: { error: string; originalContent?: string }) => void
  
  // System events
  system_message: (data: SystemMessageData) => void
  
  // Conversation events
  conversation_updated: (data: ConversationUpdateData) => void
  conversations_list: (data: { conversations: ConversationWithDetails[] }) => void
  
  // Read status events
  messages_read_update: (data: { type: 'conversation' | 'community', id: string }) => void
  
  // Typing events
  user_typing: (data: { conversationId: string; userId: string; userName: string }) => void
  user_stopped_typing: (data: { conversationId: string; userId: string }) => void
  
  // Community events
  community_message_sent: (data: CommunityMessageSentData) => void
  community_new_message: (data: CommunityNewMessageData) => void
  community_user_typing: (data: { communityId: string; userId: string; userName: string }) => void
  community_user_stopped_typing: (data: { communityId: string; userId: string }) => void
  community_joined: (data: { communityId: string; message: string }) => void
  community_left: (data: { communityId: string; message: string }) => void
  
  // Test chat events
  receiveMessage: (data: { id: string; text: string; senderId: string; senderName: string; timestamp: Date }) => void
  autoCreateChat: (data: { targetUserId: string; targetUserName: string; roomId: string }) => void
  userJoined: (data: { userId: string; userName: string }) => void
  userLeft: (data: { userId: string; userName: string }) => void
  
  // Connection events
  connected: (data: { userId: string; timestamp: Date }) => void
  error: (data: { message: string; code?: string }) => void
}

export interface MessageSentData {
  id: string
  content: string
  createdAt: Date
  conversationId: string
  sender: {
    id: string
    name: string
    avatarUrl: string | null
  }
  isFromCreator: boolean
  isRead: boolean
}

export interface NewMessageData {
  id: string
  content: string
  createdAt: Date
  conversationId: string
  sender: {
    id: string
    name: string
    avatarUrl: string | null
  }
  isFromCreator: boolean
  isRead: boolean
}

export interface ConversationUpdatedData {
  conversationId: string
  lastMessage: {
    content: string
    createdAt: Date
    isFromFan: boolean
  }
  lastMessageAt: Date
  unreadCount?: number
}

export interface MessagesReadUpdateData {
  conversationId: string
  readByUserId: string
  unreadCount: number
  timestamp: Date
}

// Socket data attached to each connection
export interface SocketData {
  userId: string
  userRole: 'CREATOR' | 'CONSUMER' | 'ADMIN'
  userName: string
}

// Inter-server events (for future scaling)
export interface InterServerEvents {
  // For Redis adapter when scaling horizontally
}

// Request/Response data structures
export interface SendMessageRequest {
  conversationId: string
  content: string
}

export interface JoinConversationRequest {
  conversationId: string
}

export interface AuthPayload {
  userId: string
  role: 'CREATOR' | 'CONSUMER' | 'ADMIN'
  iat: number
  exp: number
}

// Community-specific data interfaces
export interface Community {
  id: string
  name: string
  description?: string
  type: string // 'CONTENT_COMMUNITY' | 'SUBSCRIPTION_COMMUNITY'
  maxMembers: number
  contentId?: string
  creatorId: string
  createdAt: Date
  updatedAt: Date
}

export interface CommunityMember {
  id: string
  userId: string
  communityId: string
  joinedAt: Date
  lastActive?: Date
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export interface CommunityMessageSentData {
  id: string
  content: string
  createdAt: Date
  conversationId: string
  communityId: string
  sender: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export interface CommunityNewMessageData {
  id: string
  content: string
  createdAt: Date
  conversationId: string
  communityId: string
  sender: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

// Community-specific request interfaces
export interface SendCommunityMessageRequest {
  communityId: string
  content: string
}

// A unified event for real-time updates to the conversation/community list
export interface ConversationUpdateData {
  type: 'conversation' | 'community';
  id: string; // ID of the conversation or community
  lastMessage: string;
  lastMessageSender?: string; // For community chats, to show "Name: message"
  lastMessageTime: string; // ISO string
  unreadCount: number;
} 