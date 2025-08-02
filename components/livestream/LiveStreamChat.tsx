// components/livestream/LiveStreamChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system' | 'moderator';
}

interface ChatUser {
  socketId: string;
  username: string;
  userId?: string;
  isModerator: boolean;
  isStreamer: boolean;
  joinedAt: Date;
}

interface LiveStreamChatProps {
  streamId: string;
  username: string;
  userId?: string;
  isStreamer?: boolean;
  socket: Socket;
}

export const LiveStreamChat: React.FC<LiveStreamChatProps> = ({
  streamId,
  username,
  userId,
  isStreamer = false,
  socket
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [username: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageCounterRef = useRef(0);

  // Helper function to generate unique IDs
  const generateUniqueId = (prefix: string = 'msg') => {
    messageCounterRef.current++;
    return `${prefix}_${Date.now()}_${messageCounterRef.current}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join chat when component mounts
  useEffect(() => {
    if (socket && streamId && username) {
      // Join chat
      socket.emit('joinChat', { streamId, username, userId }, (response: any) => {
        if (response.success) {
          setIsConnected(true);
          // Ensure unique messages when setting initial state
          const uniqueMessages = response.recentMessages ? 
            response.recentMessages.filter((msg: ChatMessage, index: number, arr: ChatMessage[]) => 
              arr.findIndex(m => m.id === msg.id) === index
            ) : [];
          setMessages(uniqueMessages);
          setChatUsers(response.chatUsers || []);
          setError(null);
        } else {
          setError(response.error || 'Failed to join chat');
        }
      });

      // Set up event listeners
      const handleNewMessage = (data: { message: ChatMessage }) => {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(msg => msg.id === data.message.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, data.message];
        });
      };

      const handleUserJoined = (data: { user: ChatUser; chatUsers: ChatUser[] }) => {
        setChatUsers(data.chatUsers);
      };

      const handleUserLeft = (data: { username?: string; chatUsers: ChatUser[] }) => {
        setChatUsers(data.chatUsers);
      };

      const handleUserTyping = (data: { username: string; isTyping: boolean }) => {
        setIsTyping(prev => ({
          ...prev,
          [data.username]: data.isTyping
        }));

        // Clear typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setIsTyping(prev => ({
              ...prev,
              [data.username]: false
            }));
          }, 3000);
        }
      };

      const handleChatCleared = (data: { clearedBy: string }) => {
        setMessages([]);
        // Add system message about chat being cleared
        const clearMessage: ChatMessage = {
          id: generateUniqueId('clear'),
          streamId,
          userId: 'system',
          username: 'System',
          message: `Chat was cleared by ${data.clearedBy}`,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages([clearMessage]);
      };

      socket.on('newChatMessage', handleNewMessage);
      socket.on('userJoinedChat', handleUserJoined);
      socket.on('userLeftChat', handleUserLeft);
      socket.on('userTyping', handleUserTyping);
      socket.on('chatCleared', handleChatCleared);

      // Cleanup on unmount
      return () => {
        socket.emit('leaveChat', { streamId });
        socket.off('newChatMessage', handleNewMessage);
        socket.off('userJoinedChat', handleUserJoined);
        socket.off('userLeftChat', handleUserLeft);
        socket.off('userTyping', handleUserTyping);
        socket.off('chatCleared', handleChatCleared);
      };
    }
  }, [socket, streamId, username, userId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    socket.emit('sendChatMessage', {
      streamId,
      message: newMessage.trim(),
      username,
      userId
    }, (response: any) => {
      if (response.success) {
        setNewMessage('');
        setError(null);
      } else {
        setError(response.error || 'Failed to send message');
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    socket.emit('chatTyping', { streamId, username, isTyping: true });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chatTyping', { streamId, username, isTyping: false });
    }, 1000);
  };

  const clearChat = () => {
    if (isStreamer) {
      socket.emit('clearChat', { streamId }, (response: any) => {
        if (!response.success) {
          setError(response.error || 'Failed to clear chat');
        }
      });
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageClass = (message: ChatMessage) => {
    switch (message.type) {
      case 'system':
        return 'text-gray-500 italic';
      case 'moderator':
        return 'text-purple-600 font-medium';
      default:
        return 'text-gray-900';
    }
  };

  if (error && !isConnected) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to connect to chat</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg h-96 flex flex-col">
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Live Chat</h3>
          <p className="text-sm text-gray-500">{chatUsers.length} viewers</p>
        </div>
        {isStreamer && (
          <button
            onClick={clearChat}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
            title="Clear chat"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="text-sm">
            <span className="text-gray-500 text-xs mr-2">
              {formatTime(message.timestamp)}
            </span>
            <span className={`font-medium mr-1 ${message.type === 'moderator' ? 'text-purple-600' : 'text-gray-700'}`}>
              {message.username}
              {message.type === 'moderator' && <span className="text-purple-500 ml-1">★</span>}:
            </span>
            <span className={getMessageClass(message)}>
              {message.message}
            </span>
          </div>
        ))}
        
        {/* Typing Indicators */}
        {Object.entries(isTyping).map(([user, typing]) => 
          typing && (
            <div key={`typing-${user}`} className="text-sm text-gray-500 italic">
              {user} is typing...
            </div>
          )
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-gray-200">
        {error && (
          <div className="text-red-600 text-sm mb-2">{error}</div>
        )}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            maxLength={500}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {newMessage.length}/500 characters
        </div>
      </div>
    </div>
  );
};
