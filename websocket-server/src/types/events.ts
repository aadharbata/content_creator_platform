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
  join_conversation: (data: { conversationId: string }) => void
  leave_conversation: (data: { conversationId: string }) => void
  send_message: (data: { conversationId: string; content: string }) => void
  typing_start: (data: { conversationId: string }) => void
  typing_stop: (data: { conversationId: string }) => void
  mark_as_read: (data: { conversationId: string; messageIds: string[] }) => void
}

// Server to Client Events
export interface ServerToClientEvents {
  // Message events
  message_sent: (data: MessageSentData) => void
  new_message: (data: NewMessageData) => void
  message_error: (data: { error: string; originalContent?: string }) => void
  
  // Conversation events
  conversation_updated: (data: ConversationUpdatedData) => void
  conversations_list: (data: { conversations: ConversationWithDetails[] }) => void
  
  // Read status events
  messages_read_update: (data: MessagesReadUpdateData) => void
  
  // Typing events
  user_typing: (data: { conversationId: string; userId: string; userName: string }) => void
  user_stopped_typing: (data: { conversationId: string; userId: string }) => void
  
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