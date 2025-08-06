"use client";

import { useState, useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

interface CommunityMessage {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  communityId?: string; // Add communityId field for proper message routing
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export default function SimpleCommunityTestPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [communityId, setCommunityId] = useState('test-community-1');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectAndJoin = () => {
    if (!userId || !userName || !communityId) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
      const socketInstance = io(URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false,
        withCredentials: false,
        auth: {
          userId,
          userName,
          userRole: 'CONSUMER'
        }
      });

      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
        
        // Auto-join the community room using proper community join event
        socketInstance.emit('join', { userId, userName });
        
        // Join the specific community
        setTimeout(() => {
          socketInstance.emit('join_community', {
            communityId
          });
        }, 100);
        
        // Add system message
        const systemMessage: CommunityMessage = {
          id: `system-${Date.now()}`,
          content: `✅ Connected to community "${communityId}" as ${userName}`,
          createdAt: new Date(),
          senderId: 'system',
          sender: {
            id: 'system',
            name: 'System',
            avatarUrl: null
          }
        };
        setMessages([systemMessage]);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
        setMessages([]);
        setTypingUsers({});
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Connection error:', error);
        alert('❌ Failed to connect to chat server');
      });

      // Community message event - use specific community message event
      socketInstance.on('community_new_message', (message: CommunityMessage) => {
        console.log('Received community message:', message);
        // Only process messages that belong to the current community
        if (!message.communityId || message.communityId === communityId) {
          setMessages(prev => {
            // Prevent duplicates
            const exists = prev.some(m => m.id === message.id);
            if (!exists) {
              return [...prev, message];
            }
            return prev;
          });
        }
      });

      // Typing events
      socketInstance.on('community_user_typing', (data: { communityId: string; userId: string; userName: string }) => {
        if (data.communityId === communityId && data.userId !== userId) {
          setTypingUsers(prev => ({
            ...prev,
            [data.userId]: data.userName
          }));

          // Auto-clear typing after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const newTyping = { ...prev };
              delete newTyping[data.userId];
              return newTyping;
            });
          }, 3000);
        }
      });

      socketInstance.on('community_user_stopped_typing', (data: { communityId: string; userId: string }) => {
        if (data.communityId === communityId) {
          setTypingUsers(prev => {
            const newTyping = { ...prev };
            delete newTyping[data.userId];
            return newTyping;
          });
        }
      });

      socketInstance.on('error', (error: any) => {
        console.error('Socket error:', error);
        alert(`Error: ${error.message || 'Unknown error'}`);
      });

      // Community join/leave confirmation events
      socketInstance.on('community_joined', (data: { communityId: string; message: string }) => {
        console.log('Successfully joined community:', data);
      });

      socketInstance.on('community_left', (data: { communityId: string; message: string }) => {
        console.log('Left community:', data);
      });

      socketInstance.connect();

    } catch (error) {
      console.error('Socket connection error:', error);
      alert('Failed to create socket connection');
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setMessages([]);
      setTypingUsers({});
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket || !isConnected) {
      return;
    }

    const messageData = {
      communityId,
      content: messageInput.trim()
    };

    console.log('Sending community message:', messageData);
    // Use standard community message event (now supports non-UUID IDs in development)
    socket.emit('send_community_message', messageData);
    
    setMessageInput('');
    
    // Stop typing
    socket.emit('community_typing_stop', { communityId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    if (!socket || !isConnected) return;

    // Send typing indicator
    if (value.trim()) {
      socket.emit('community_typing_start', { communityId });
    } else {
      socket.emit('community_typing_stop', { communityId });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypingText = () => {
    const typingUserNames = Object.values(typingUsers);
    if (typingUserNames.length === 0) return '';
    
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
    } else {
      return `${typingUserNames[0]} and ${typingUserNames.length - 1} others are typing...`;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Simple Community Chat Test</h1>
      
      {/* Connection Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Join Community Chat</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., user1"
              disabled={isConnected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Your Name:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., John Doe"
              disabled={isConnected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Community ID:</label>
            <input
              type="text"
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., test-community-1"
              disabled={isConnected}
            />
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          {!isConnected ? (
            <button
              onClick={connectAndJoin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
            >
              Connect & Join Community
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium"
            >
              Disconnect
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? `Connected to ${communityId}` : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-md flex flex-col h-96">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-semibold">Community: {communityId}</h3>
            <div className="text-sm text-gray-600">Chatting as: {userName} ({userId})</div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === userId
                        ? 'bg-blue-500 text-white'
                        : message.senderId === 'system'
                        ? 'bg-green-100 text-green-800 text-center w-full'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {message.senderId !== userId && message.senderId !== 'system' && (
                      <div className="text-xs font-medium text-blue-600 mb-1">
                        {message.sender.name}
                      </div>
                    )}
                    <div className="break-words">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.senderId === userId 
                        ? 'text-blue-100' 
                        : message.senderId === 'system'
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {getTypingText() && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 italic">
                    {getTypingText()}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Type a message to ${communityId}...`}
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Test Guide */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Quick Test Guide:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">For User 1:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>User ID: <code className="bg-gray-200 px-1 rounded">user1</code></li>
              <li>Name: <code className="bg-gray-200 px-1 rounded">Alice</code></li>
              <li>Community: <code className="bg-gray-200 px-1 rounded">test-community-1</code></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">For User 2 (in another tab):</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>User ID: <code className="bg-gray-200 px-1 rounded">user2</code></li>
              <li>Name: <code className="bg-gray-200 px-1 rounded">Bob</code></li>
              <li>Community: <code className="bg-gray-200 px-1 rounded">test-community-1</code></li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 rounded-md">
          <strong>Note:</strong> Both users must use the same Community ID to chat together. 
          Make sure the WebSocket server is running on port 3001.
        </div>
      </div>
    </div>
  );
}
