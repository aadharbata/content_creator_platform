import { io, Socket } from 'socket.io-client'
import { 
  MessageSentData, 
  NewMessageData, 
  ConversationUpdatedData,
  MessagesReadUpdateData
} from '../websocket-server/src/types/events'

// Client-side events (what we can emit to server)
interface ClientToServerEvents {
  send_message: (data: { conversationId: string; content: string }) => void
  join_conversation: (data: { conversationId: string }) => void
  leave_conversation: (data: { conversationId: string }) => void
  typing_start: (data: { conversationId: string }) => void
  typing_stop: (data: { conversationId: string }) => void
  mark_as_read: (data: { conversationId: string }) => void
}

// Server-side events (what we receive from server)
interface ServerToClientEvents {
  connected: (data: { userId: string; timestamp: Date }) => void
  message_sent: (data: MessageSentData) => void
  new_message: (data: NewMessageData) => void
  conversation_updated: (data: ConversationUpdatedData) => void
  messages_read_update: (data: MessagesReadUpdateData) => void
  user_typing: (data: { conversationId: string; userId: string; userName: string }) => void
  user_stopped_typing: (data: { conversationId: string; userId: string }) => void
  error: (data: { message: string; code?: string }) => void
}

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private isConnecting = false

  connect(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket
    }

    if (this.isConnecting) {
      return this.socket!
    }

    this.isConnecting = true

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
    
    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      autoConnect: true
    })

    this.setupEventHandlers()
    
    return this.socket
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server')
      this.reconnectAttempts = 0
      this.isConnecting = false
    })

    this.socket.on('connected', (data) => {
      console.log('📡 Server confirmed connection for user:', data.userId)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason)
      this.isConnecting = false
      
      // Don't attempt to reconnect if the disconnection was intentional
      if (reason === 'io client disconnect') {
        return
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Connection error:', error.message)
      this.reconnectAttempts++
      this.isConnecting = false
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🚨 Max reconnection attempts reached')
        this.disconnect()
      }
    })

    this.socket.on('error', (error) => {
      console.error('🔥 Socket error:', error)
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnecting = false
    this.reconnectAttempts = 0
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  // Convenience methods for common actions
  sendMessage(conversationId: string, content: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected')
    }
    this.socket.emit('send_message', { conversationId, content })
  }

  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected')
    }
    this.socket.emit('join_conversation', { conversationId })
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected')
    }
    this.socket.emit('leave_conversation', { conversationId })
  }

  startTyping(conversationId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('typing_start', { conversationId })
  }

  stopTyping(conversationId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('typing_stop', { conversationId })
  }

  markAsRead(conversationId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('mark_as_read', { conversationId })
  }

  // Event listener helpers
  onMessageSent(callback: (data: MessageSentData) => void): void {
    this.socket?.on('message_sent', callback)
  }

  onNewMessage(callback: (data: NewMessageData) => void): void {
    this.socket?.on('new_message', callback)
  }

  onConversationUpdated(callback: (data: ConversationUpdatedData) => void): void {
    this.socket?.on('conversation_updated', callback)
  }

  onMessagesReadUpdate(callback: (data: MessagesReadUpdateData) => void): void {
    this.socket?.on('messages_read_update', callback)
  }

  onUserTyping(callback: (data: { conversationId: string; userId: string; userName: string }) => void): void {
    this.socket?.on('user_typing', callback)
  }

  onUserStoppedTyping(callback: (data: { conversationId: string; userId: string }) => void): void {
    this.socket?.on('user_stopped_typing', callback)
  }

  onError(callback: (data: { message: string; code?: string }) => void): void {
    this.socket?.on('error', callback)
  }

  // Clean up listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners()
  }

  removeListener(event: keyof ServerToClientEvents, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback)
    } else {
      this.socket?.removeAllListeners(event)
    }
  }
}

// Export singleton instance
export const socketManager = new SocketManager()

// Export types for use in components
export type { 
  MessageSentData, 
  NewMessageData, 
  ConversationUpdatedData,
  MessagesReadUpdateData,
  ClientToServerEvents,
  ServerToClientEvents
} 