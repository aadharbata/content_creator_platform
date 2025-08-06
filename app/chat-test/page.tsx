"use client";

import { useState, useEffect, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket-client';
import { Socket, io } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

interface ChatTab {
  id: string;
  targetUserId: string;
  targetUserName?: string;
  roomId: string;
  messages: Message[];
  unreadCount: number;
}

export default function ChatTestPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [newChatUserId, setNewChatUserId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const pendingMessagesRef = useRef<Message[]>([]);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate unique IDs for messages with more entropy
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const extraRandom = Math.random().toString(36).substr(2, 4);
    return `${timestamp}-${randomPart}-${extraRandom}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get current active tab
  const activeTab = chatTabs.find(tab => tab.id === activeTabId);
  const currentMessages = activeTab?.messages || [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const connectToSocket = () => {
    if (!userId || !userName) {
      alert('Please enter both User ID and User Name');
      return;
    }

    try {
      // Create a new socket instance with auth data for testing
      const URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
      const socketInstance = io(URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false,
        withCredentials: false, // Disable credentials for testing
        auth: {
          userId,
          userName
        }
      });

      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
        // Don't add system message here since we don't have an active tab yet
        
        // Join with user info
        console.log('Emitting join event with:', { userId, userName });
        socketInstance.emit('join', {
          userId,
          userName
        });
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
        // Clear all tabs on disconnect
        setChatTabs([]);
        setActiveTabId(null);
        // Clear processed message IDs to start fresh
        setProcessedMessageIds(new Set());
        processedMessageIdsRef.current = new Set();
        // Clear pending messages
        setPendingMessages([]);
        pendingMessagesRef.current = [];
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Connection error:', error);
        // Show error in browser alert since no active tab
        alert('❌ Failed to connect to chat server. Make sure the WebSocket server is running on port 3001.');
      });

      socketInstance.on('receiveMessage', (message: Message) => {
        console.log('Received message:', message);
        
        // Check if we've already processed this message to prevent duplicates
        if (processedMessageIdsRef.current.has(message.id)) {
          console.log('Duplicate message ignored:', message.id);
          return;
        }
        
        // Add to processed messages immediately using both state and ref
        setProcessedMessageIds(prev => {
          const newSet = new Set([...prev, message.id]);
          processedMessageIdsRef.current = newSet;
          return newSet;
        });
        
        // Find the tab for this message and add it
        setChatTabs(prev => {
          const existingTab = prev.find(tab => tab.targetUserId === message.senderId);
          
          if (existingTab) {
            // Tab exists, check if message already exists in tab
            const messageExists = existingTab.messages.some(msg => msg.id === message.id);
            
            if (!messageExists) {
              console.log('Adding message to existing tab:', message.senderId);
              return prev.map(tab => {
                if (tab.targetUserId === message.senderId) {
                  return {
                    ...tab,
                    messages: [...tab.messages, message],
                    unreadCount: tab.id === activeTabId ? 0 : tab.unreadCount + 1
                  };
                }
                return tab;
              });
            } else {
              console.log('Message already exists in tab, skipping:', message.id);
              return prev;
            }
          } else {
            // Tab doesn't exist yet, add to pending messages
            console.log('No tab exists for sender, adding to pending messages:', message.senderId);
            setPendingMessages(prevPending => {
              // Check if message is already in pending to prevent duplicates
              const messageAlreadyPending = prevPending.some(msg => msg.id === message.id);
              
              if (!messageAlreadyPending) {
                const newPending = [...prevPending, message];
                pendingMessagesRef.current = newPending;
                return newPending;
              } else {
                console.log('Message already in pending queue, skipping:', message.id);
                return prevPending;
              }
            });
            return prev;
          }
        });
      });

      socketInstance.on('autoCreateChat', (data: { targetUserId: string; targetUserName: string; roomId: string }) => {
        console.log('Auto-creating chat:', data);
        
        // Check if chat already exists
        setChatTabs(prev => {
          const existingTab = prev.find(tab => tab.targetUserId === data.targetUserId);
          if (existingTab) {
            console.log('Chat already exists for:', data.targetUserId);
            return prev; // Chat already exists
          }
          
          console.log('Creating new chat tab for:', data.targetUserId);
          
          // Create new tab
          const tabId = generateUniqueId();
          const newTab: ChatTab = {
            id: tabId,
            targetUserId: data.targetUserId,
            targetUserName: data.targetUserName,
            roomId: data.roomId,
            messages: [{
              id: generateUniqueId(),
              text: `🏠 Chat created with ${data.targetUserName || data.targetUserId}`,
              senderId: 'system',
              senderName: 'System',
              timestamp: new Date()
            }],
            unreadCount: 1 // Start with 1 unread to show the user there's a new chat
          };
          
          // Join the room automatically
          socketInstance.emit('joinRoom', {
            roomId: data.roomId,
            userId,
            targetUserId: data.targetUserId
          });
          
          console.log('New chat tab created:', newTab);
          return [...prev, newTab];
        });
        
        // Process any pending messages for this user
        setPendingMessages(prevPending => {
          const messagesForThisUser = prevPending.filter(msg => msg.senderId === data.targetUserId);
          const remainingMessages = prevPending.filter(msg => msg.senderId !== data.targetUserId);
          
          // Update the ref
          pendingMessagesRef.current = remainingMessages;
          
          if (messagesForThisUser.length > 0) {
            console.log('Processing pending messages for:', data.targetUserId, messagesForThisUser);
            
            // Add the pending messages to the newly created tab immediately
            setChatTabs(currentTabs => {
              return currentTabs.map(tab => {
                if (tab.targetUserId === data.targetUserId) {
                  // Get existing message IDs to prevent duplicates
                  const existingMessageIds = new Set(tab.messages.map(msg => msg.id));
                  
                  // Filter out messages that already exist in the tab
                  const newMessages = messagesForThisUser.filter(msg => 
                    !existingMessageIds.has(msg.id)
                  );
                  
                  if (newMessages.length > 0) {
                    console.log('Adding', newMessages.length, 'pending messages to tab for', data.targetUserId);
                    
                    // Mark these messages as processed
                    setProcessedMessageIds(prevProcessed => {
                      const newProcessedSet = new Set([...prevProcessed, ...newMessages.map(m => m.id)]);
                      processedMessageIdsRef.current = newProcessedSet;
                      return newProcessedSet;
                    });
                    
                    return {
                      ...tab,
                      messages: [...tab.messages, ...newMessages],
                      unreadCount: tab.unreadCount + newMessages.length
                    };
                  }
                }
                return tab;
              });
            });
          }
          
          return remainingMessages;
        });
      });

      socketInstance.on('userJoined', (data: { userId: string, userName: string }) => {
        console.log('User joined:', data);
        addSystemMessageToActiveTab(`👋 ${data.userName} joined the chat`);
      });

      socketInstance.on('userLeft', (data: { userId: string, userName: string }) => {
        console.log('User left:', data);
        addSystemMessageToActiveTab(`👋 ${data.userName} left the chat`);
      });

      socketInstance.connect();
    } catch (error) {
      console.error('Error setting up socket:', error);
      alert('❌ Error setting up connection');
    }
  };

  const disconnectFromSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setChatTabs([]);
      setActiveTabId(null);
      // Clear processed message IDs when manually disconnecting
      setProcessedMessageIds(new Set());
      processedMessageIdsRef.current = new Set();
      // Clear pending messages
      setPendingMessages([]);
      pendingMessagesRef.current = [];
    }
  };

  const createNewChat = () => {
    if (!socket || !newChatUserId) {
      alert('Please connect to socket and enter target user ID');
      return;
    }

    if (newChatUserId === userId) {
      alert('You cannot chat with yourself!');
      return;
    }

    // Check if chat already exists
    const existingTab = chatTabs.find(tab => tab.targetUserId === newChatUserId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      setNewChatUserId('');
      return;
    }

    // Create room ID by sorting user IDs to ensure consistency
    const participants = [userId, newChatUserId].sort();
    const newRoomId = `dm_${participants.join('_')}`;
    const tabId = generateUniqueId();
    
    console.log('Creating new chat:', { roomId: newRoomId, userId, targetUserId: newChatUserId });
    
    socket.emit('joinRoom', {
      roomId: newRoomId,
      userId,
      targetUserId: newChatUserId
    });

    // Create new tab
    const newTab: ChatTab = {
      id: tabId,
      targetUserId: newChatUserId,
      roomId: newRoomId,
      messages: [{
        id: generateUniqueId(),
        text: `🏠 Started chat with ${newChatUserId}`,
        senderId: 'system',
        senderName: 'System',
        timestamp: new Date()
      }],
      unreadCount: 0
    };

    setChatTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
    setNewChatUserId('');
  };

  const sendMessage = () => {
    if (!socket || !messageInput.trim() || !activeTab) {
      return;
    }

    const message: Message = {
      id: generateUniqueId(),
      text: messageInput.trim(),
      senderId: userId,
      senderName: userName,
      timestamp: new Date()
    };

    console.log('Sending message:', { 
      ...message, 
      roomId: activeTab.roomId, 
      targetUserId: activeTab.targetUserId 
    });

    socket.emit('sendMessage', {
      ...message,
      roomId: activeTab.roomId,
      targetUserId: activeTab.targetUserId
    });

    // Add to active tab messages immediately
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, messages: [...tab.messages, message] }
        : tab
    ));
    
    // Mark this message as processed to prevent duplicates
    setProcessedMessageIds(prev => {
      const newSet = new Set([...prev, message.id]);
      processedMessageIdsRef.current = newSet;
      return newSet;
    });
    
    setMessageInput('');
  };

  const addSystemMessageToActiveTab = (text: string) => {
    if (!activeTabId) return;
    
    const systemMessage: Message = {
      id: generateUniqueId(),
      text,
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date()
    };
    
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, messages: [...tab.messages, systemMessage] }
        : tab
    ));
  };

  const closeTab = (tabId: string) => {
    setChatTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      const remainingTabs = chatTabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[0].id : null);
    }
  };

  const markTabAsRead = (tabId: string) => {
    setChatTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, unreadCount: 0 }
        : tab
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">Chat Test - One on One DMs</h1>
          <p className="text-blue-100">Simple client-side chat testing (No auth required)</p>
        </div>

        {/* Connection Panel */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isConnected}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isConnected}
              />
            </div>
            <div className="flex items-end">
              {!isConnected ? (
                <button
                  onClick={connectToSocket}
                  disabled={!userId || !userName}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                  Connect
                </button>
              ) : (
                <button
                  onClick={disconnectFromSocket}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* New Chat Panel */}
          {isConnected && (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start New Chat (User ID)
                </label>
                <input
                  type="text"
                  value={newChatUserId}
                  onChange={(e) => setNewChatUserId(e.target.value)}
                  placeholder="Enter user ID to chat with"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={createNewChat}
                disabled={!newChatUserId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                Start Chat
              </button>
            </div>
          )}

          {/* Status Display */}
          <div className="mt-4 flex gap-4 text-sm">
            <span className={`px-2 py-1 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {activeTab && (
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                Active: {activeTab.targetUserId}
              </span>
            )}
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
              Chats: {chatTabs.length}
            </span>
            {pendingMessages.length > 0 && (
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">
                Pending: {pendingMessages.length}
              </span>
            )}
          </div>
        </div>

        {/* Chat Tabs */}
        {chatTabs.length > 0 && (
          <div className="border-b bg-gray-50">
            <div className="flex overflow-x-auto">
              {chatTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex-shrink-0 border-b-2 transition-colors ${
                    activeTabId === tab.id
                      ? 'border-blue-500 bg-white'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        setActiveTabId(tab.id);
                        markTabAsRead(tab.id);
                      }}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTabId === tab.id
                          ? 'text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{tab.targetUserId}</span>
                        {tab.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                            {tab.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => closeTab(tab.id)}
                      className="px-2 py-2 text-gray-400 hover:text-gray-600 text-sm"
                      title="Close chat"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-4 space-y-3">
          {chatTabs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No active chats</p>
                <p className="text-sm">Connect and start a new chat to begin messaging</p>
              </div>
            </div>
          ) : !activeTab ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a chat tab to view messages</p>
            </div>
          ) : (
            currentMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === 'system'
                      ? 'bg-gray-200 text-gray-700 text-center italic'
                      : message.senderId === userId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-800'
                  }`}
                >
                  {message.senderId !== 'system' && message.senderId !== userId && (
                    <div className="text-xs font-semibold mb-1">{message.senderName}</div>
                  )}
                  <div className="break-words">{message.text}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {isConnected && activeTab && (
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Type a message to ${activeTab.targetUserId}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Instructions:</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Enter your User ID and Name, then click Connect</li>
                <li>2. Enter a User ID in "Start New Chat" to begin chatting</li>
                <li>3. Click "Start Chat" to create a new chat tab</li>
                <li>4. Switch between chat tabs to manage multiple conversations</li>
                <li>5. Use the × button to close chat tabs</li>
                <li>6. Unread message counts appear as red badges on tabs</li>
                <li>7. <strong>NEW:</strong> Send messages to offline users - they'll get them when they connect!</li>
                <li>8. <strong>NEW:</strong> Chat tabs auto-create when you receive messages from new users</li>
              </ol>
            </div>
            
            {/* Quick Test Section */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Quick Test</h4>
              <p className="text-xs text-blue-600 mb-2">Need test users?</p>
              <div className="space-y-1 text-xs">
                <div>User 1: <code className="bg-blue-100 px-1 rounded">alice</code></div>
                <div>User 2: <code className="bg-blue-100 px-1 rounded">bob</code></div>
              </div>
            </div>
          </div>
          
          {/* Server Status Check */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Make sure the WebSocket server is running on port 3001:
            </p>
            <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-1 block">
              cd websocket-server && npm run dev
            </code>
          </div>
          
          {/* Offline Messaging Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💬 Offline Messaging:</strong> You can now send messages to users who aren't online! 
              They'll receive all messages when they connect. Chat tabs will auto-create for incoming messages.
            </p>
          </div>

          {/* Debug Info */}
          {(pendingMessages.length > 0 || processedMessageIds.size > 10) && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>🐛 Debug Info:</strong> 
                {pendingMessages.length > 0 && ` Pending messages: ${pendingMessages.length}`}
                {processedMessageIds.size > 0 && ` | Processed: ${processedMessageIds.size}`}
              </p>
              {pendingMessages.length > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Pending from: {[...new Set(pendingMessages.map(m => m.senderId))].join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
