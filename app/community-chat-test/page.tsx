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

interface Community {
  id: string;
  name: string;
  messages: CommunityMessage[];
  isTyping: { [userId: string]: string }; // userId -> userName
}

interface TypingIndicator {
  communityId: string;
  userId: string;
  userName: string;
}

interface SystemMessage {
  id: string;
  type: 'moderation_warning' | 'info' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

export default function CommunityChatTestPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [newCommunityId, setNewCommunityId] = useState('');
  const [newCommunityName, setNewCommunityName] = useState('');
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate unique IDs for messages
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${randomPart}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeCommunity = communities.find(c => c.id === activeCommunityId);

  useEffect(() => {
    scrollToBottom();
  }, [activeCommunity?.messages]);

  const connectToSocket = () => {
    if (!userId || !userName) {
      alert('Please enter both User ID and User Name');
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
          userRole: 'CONSUMER' // Mock role for testing
        }
      });

      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
        setCommunities([]);
        setActiveCommunityId(null);
        setSystemMessages([]);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Connection error:', error);
        alert('❌ Failed to connect to chat server. Make sure the WebSocket server is running on port 3001.');
      });

      // Community message events - use specific community message event
      socketInstance.on('community_new_message', (message: CommunityMessage) => {
        console.log('Received community message:', message);
        
        setCommunities(prev => {
          return prev.map(community => {
            // Only add message if it belongs to this specific community
            if (community.id === message.communityId) {
              const messageExists = community.messages.some(m => m.id === message.id);
              if (!messageExists) {
                return {
                  ...community,
                  messages: [...community.messages, message]
                };
              }
            }
            return community;
          });
        });
      });

      socketInstance.on('community_user_typing', (data: TypingIndicator) => {
        console.log('User typing in community:', data);
        
        setCommunities(prev => {
          return prev.map(community => {
            if (community.id === data.communityId) {
              return {
                ...community,
                isTyping: {
                  ...community.isTyping,
                  [data.userId]: data.userName
                }
              };
            }
            return community;
          });
        });

        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setCommunities(prev => {
            return prev.map(community => {
              if (community.id === data.communityId) {
                const newTyping = { ...community.isTyping };
                delete newTyping[data.userId];
                return {
                  ...community,
                  isTyping: newTyping
                };
              }
              return community;
            });
          });
        }, 3000);
      });

      socketInstance.on('community_user_stopped_typing', (data: { communityId: string; userId: string }) => {
        console.log('User stopped typing in community:', data);
        
        setCommunities(prev => {
          return prev.map(community => {
            if (community.id === data.communityId) {
              const newTyping = { ...community.isTyping };
              delete newTyping[data.userId];
              return {
                ...community,
                isTyping: newTyping
              };
            }
            return community;
          });
        });
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

      // System message events (including moderation warnings)
      socketInstance.on('system_message', (data: Omit<SystemMessage, 'id'>) => {
        console.log('Received system message:', data);
        const systemMessage: SystemMessage = {
          id: generateUniqueId(),
          ...data,
          timestamp: new Date(data.timestamp)
        };
        
        setSystemMessages(prev => [...prev, systemMessage]);
        
        // Auto-remove the message after 10 seconds
        setTimeout(() => {
          setSystemMessages(prev => prev.filter(msg => msg.id !== systemMessage.id));
        }, 10000);
      });

      socketInstance.connect();

    } catch (error) {
      console.error('Socket connection error:', error);
      alert('Failed to create socket connection');
    }
  };

  const disconnectFromSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setCommunities([]);
      setActiveCommunityId(null);
      setSystemMessages([]);
    }
  };

  const joinCommunity = () => {
    if (!newCommunityId || !newCommunityName) {
      alert('Please enter both Community ID and Name');
      return;
    }

    if (!socket || !isConnected) {
      alert('Please connect to socket first');
      return;
    }

    // Check if community already exists
    const existingCommunity = communities.find(c => c.id === newCommunityId);
    if (existingCommunity) {
      alert('You are already in this community');
      return;
    }

    // Add community to local state
    const newCommunity: Community = {
      id: newCommunityId,
      name: newCommunityName,
      messages: [{
        id: generateUniqueId(),
        content: `🏠 Welcome to ${newCommunityName}! You can now send messages to this community.`,
        createdAt: new Date(),
        senderId: 'system',
        sender: {
          id: 'system',
          name: 'System',
          avatarUrl: null
        }
      }],
      isTyping: {}
    };

    setCommunities(prev => [...prev, newCommunity]);
    setActiveCommunityId(newCommunityId);
    
    // Join the community room using the proper community join event
    socket.emit('join_community', {
      communityId: newCommunityId
    });
    
    // Clear form
    setNewCommunityId('');
    setNewCommunityName('');

    console.log('Joined community:', newCommunityId);
  };

  const leaveCommunity = (communityId: string) => {
    if (!socket || !isConnected) {
      alert('Not connected to socket');
      return;
    }

    // Leave the community room
    socket.emit('leave_community', {
      communityId
    });

    // Remove community from local state
    setCommunities(prev => prev.filter(c => c.id !== communityId));
    
    // If the active community was removed, clear the selection
    if (activeCommunityId === communityId) {
      setActiveCommunityId(null);
    }

    console.log('Left community:', communityId);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket || !activeCommunityId) {
      return;
    }

    if (!isConnected) {
      alert('Not connected to socket');
      return;
    }

    const messageData = {
      communityId: activeCommunityId,
      content: messageInput.trim()
    };

    console.log('Sending community message:', messageData);
    // Use standard community message event (now supports non-UUID IDs in development)
    socket.emit('send_community_message', messageData);
    
    setMessageInput('');

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socket.emit('community_typing_stop', { communityId: activeCommunityId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!socket || !activeCommunityId) return;

    // Send typing start event
    socket.emit('community_typing_start', { communityId: activeCommunityId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('community_typing_stop', { communityId: activeCommunityId });
    }, 2000);
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
    if (!activeCommunity) return '';
    
    const typingUsers = Object.values(activeCommunity.isTyping).filter(name => name !== userName);
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else {
      return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Community Chat Test</h1>
      
      {/* Connection Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connection Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your user ID"
              disabled={isConnected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">User Name:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your display name"
              disabled={isConnected}
            />
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          {!isConnected ? (
            <button
              onClick={connectToSocket}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
            >
              Connect to Chat
            </button>
          ) : (
            <button
              onClick={disconnectFromSocket}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium"
            >
              Disconnect
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Community Management Panel */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Join Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Community ID:</label>
              <input
                type="text"
                value={newCommunityId}
                onChange={(e) => setNewCommunityId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter community ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Community Name:</label>
              <input
                type="text"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter community name"
              />
            </div>
          </div>
          
          <button
            onClick={joinCommunity}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium"
          >
            Join Community
          </button>
        </div>
      )}

      {/* Main Chat Interface */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Community List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">Communities ({communities.length})</h3>
              <div className="space-y-2">
                {communities.map((community) => (
                  <div
                    key={community.id}
                    className={`p-3 rounded-md transition-colors border ${
                      activeCommunityId === community.id
                        ? 'bg-blue-100 border-l-4 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setActiveCommunityId(community.id)}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium truncate">{community.name}</div>
                        <div className="text-sm text-gray-500">
                          {community.messages.length} messages
                        </div>
                      </button>
                      <button
                        onClick={() => leaveCommunity(community.id)}
                        className="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                        title="Leave community"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                ))}
                
                {communities.length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    No communities joined yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            {activeCommunity ? (
              <div className="bg-white rounded-lg shadow-md flex flex-col h-96">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">{activeCommunity.name}</h3>
                  <div className="text-sm text-gray-500">Community ID: {activeCommunity.id}</div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  <div className="space-y-3">
                    {activeCommunity.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === userId
                              ? 'bg-blue-500 text-white'
                              : message.senderId === 'system'
                              ? 'bg-gray-200 text-gray-700 text-center'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          {message.senderId !== userId && message.senderId !== 'system' && (
                            <div className="text-xs font-medium text-gray-600 mb-1">
                              {message.sender.name}
                            </div>
                          )}
                          <div className="break-words">{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.senderId === userId ? 'text-blue-100' : 'text-gray-500'
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

                {/* System Messages Display */}
                {systemMessages.length > 0 && (
                  <div className="px-4 py-2 space-y-2">
                    {systemMessages.map((sysMsg) => (
                      <div
                        key={sysMsg.id}
                        className={`p-3 rounded-lg text-sm ${
                          sysMsg.type === 'moderation_warning' 
                            ? 'bg-yellow-100 border border-yellow-300 text-yellow-800'
                            : sysMsg.type === 'error'
                            ? 'bg-red-100 border border-red-300 text-red-800'
                            : sysMsg.type === 'success'
                            ? 'bg-green-100 border border-green-300 text-green-800'
                            : 'bg-blue-100 border border-blue-300 text-blue-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {sysMsg.type === 'moderation_warning' && '⚠️ Content Warning'}
                              {sysMsg.type === 'error' && '❌ Error'}
                              {sysMsg.type === 'success' && '✅ Success'}
                              {sysMsg.type === 'info' && 'ℹ️ Info'}
                            </div>
                            <div className="mt-1">{sysMsg.message}</div>
                          </div>
                          <button
                            onClick={() => setSystemMessages(prev => prev.filter(msg => msg.id !== sysMsg.id))}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Type a message to ${activeCommunity.name}...`}
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
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-500 text-lg">
                  Select a community to start chatting
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  Join a community using the panel above to begin messaging
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">How to Test Community Chat:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Enter a unique User ID and your display name, then click "Connect to Chat"</li>
          <li>Enter a Community ID (like "test-community-1") and name, then click "Join Community"</li>
          <li>Open this page in another browser tab/window with a different User ID to simulate another user</li>
          <li>Both users should join the same Community ID to chat together</li>
          <li>Send messages and see real-time delivery and typing indicators</li>
          <li>Test with multiple communities by joining different Community IDs</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded-md">
          <strong>Note:</strong> This is a test interface without authentication. 
          Make sure the WebSocket server is running on port 3001.
        </div>
      </div>
    </div>
  );
}
