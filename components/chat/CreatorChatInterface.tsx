'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { getSocket, connectSocket, disconnectSocket, setSocketAuth } from '@/lib/socket-client';
import type { ChatListItem, MessageWithSender } from '@/lib/types/shared';
import { useSearchParams } from 'next/navigation';
import { Search, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CreatorChatInterfaceProps {
  conversations: any[];
  selectedConversation: any;
  setSelectedConversation: (conversation: any) => void;
  messages: any[];
  setMessages: (messages: any[]) => void;
  messagesLoading: boolean;
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: () => void;
  sendingMessage: boolean;
  conversationSearch: string;
  setConversationSearch: (search: string) => void;
  filteredConversations: any[];
  handleCreatorClick: (id: string) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  t: any;
}

export function CreatorChatInterface({
  conversations,
  selectedConversation,
  setSelectedConversation,
  messages,
  setMessages,
  messagesLoading,
  newMessage,
  setNewMessage,
  sendMessage,
  sendingMessage,
  conversationSearch,
  setConversationSearch,
  filteredConversations,
  handleCreatorClick,
  messagesContainerRef,
  messagesEndRef,
  t
}: CreatorChatInterfaceProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const currentUserName = (session?.user as any)?.name || 'User';

  const [activeFilter, setActiveFilter] = useState<'all' | 'creators' | 'consumers'>('all');
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [activeChat, setActiveChat] = useState<ChatListItem | null>(null);

  // Convert dashboard conversations to ChatListItem format for the sidebar
  const convertConversationsToChats = useCallback((conversations: any[]): ChatListItem[] => {
    return conversations.map(conv => ({
      id: conv.id,
      type: 'conversation' as const,
      name: conv.fan.name,
      imageUrl: conv.fan.avatarUrl,
      lastMessage: conv.lastMessage ? {
        id: 'temp',
        content: conv.lastMessage.content,
        createdAt: new Date(conv.lastMessage.createdAt),
        updatedAt: new Date(conv.lastMessage.createdAt),
        isRead: false,
        conversationId: conv.id,
        senderId: conv.lastMessage.isFromFan ? conv.fan.id : currentUserId,
        sender: {
          id: conv.lastMessage.isFromFan ? conv.fan.id : currentUserId,
          name: conv.lastMessage.isFromFan ? conv.fan.name : currentUserName,
          image: conv.lastMessage.isFromFan ? conv.fan.avatarUrl : undefined
        }
      } : undefined,
      unreadCount: conv.unreadCount,
      otherUser: {
        id: conv.fan.id,
        name: conv.fan.name,
        image: conv.fan.avatarUrl
      },
      // Required Conversation properties
      creatorId: conv.creatorId || '',
      fanId: conv.fanId || conv.fan.id,
      lastMessageAt: new Date(conv.lastMessageAt || Date.now()),
      createdAt: new Date(conv.createdAt || Date.now()),
      updatedAt: new Date(conv.updatedAt || Date.now())
    }));
  }, [currentUserId, currentUserName]);

  // Update chats when conversations change
  useEffect(() => {
    const convertedChats = convertConversationsToChats(conversations);
    setChats(convertedChats);
  }, [conversations, convertConversationsToChats]);

  // Set active chat when selectedConversation changes
  useEffect(() => {
    if (selectedConversation) {
      const chat = chats.find(c => c.id === selectedConversation.id);
      if (chat) {
        setActiveChat(chat);
      }
    } else {
      setActiveChat(null);
    }
  }, [selectedConversation, chats]);

  // Handle chat selection
  const handleSelectChat = useCallback((chat: ChatListItem) => {
    setActiveChat(chat);
    const conversation = conversations.find(c => c.id === chat.id);
    if (conversation) {
      setSelectedConversation(conversation);
    }
  }, [conversations, setSelectedConversation]);

  // Handle chat ID resolution
  const handleResolveChatId = useCallback((oldId: string, newId: string) => {
    setChats(prevChats => prevChats.map(chat => 
      chat.id === oldId ? { ...chat, id: newId } : chat
    ));
    if (activeChat?.id === oldId) {
      setActiveChat(prev => prev ? { ...prev, id: newId } : null);
    }
  }, [activeChat]);

  // Convert dashboard messages to MessageWithSender format
  const convertMessagesToMessageWithSender = useCallback((messages: any[]): MessageWithSender[] => {
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
      updatedAt: new Date(msg.updatedAt || msg.createdAt),
      isRead: msg.isRead || false,
      conversationId: msg.conversationId || selectedConversation?.id,
      senderId: msg.senderId || (msg.isFromCreator ? currentUserId : selectedConversation?.fan?.id),
      sender: {
        id: msg.senderId || (msg.isFromCreator ? currentUserId : selectedConversation?.fan?.id),
        name: msg.senderName || (msg.isFromCreator ? currentUserName : selectedConversation?.fan?.name),
        image: msg.senderImage || (msg.isFromCreator ? undefined : selectedConversation?.fan?.avatarUrl)
      }
    }));
  }, [currentUserId, currentUserName, selectedConversation]);

  const convertedMessages = convertMessagesToMessageWithSender(messages);

  // Wrapper function to handle setMessages type mismatch
  const handleSetMessages = useCallback((newMessages: MessageWithSender[] | ((prev: MessageWithSender[]) => MessageWithSender[])) => {
    if (typeof newMessages === 'function') {
      const result = newMessages(convertedMessages);
      setMessages(result as any[]);
    } else {
      setMessages(newMessages as any[]);
    }
  }, [convertedMessages, setMessages]);

  // Filter conversations based on active filter
  const getFilteredConversations = useCallback(() => {
    if (activeFilter === 'all') {
      return conversations;
    }
    // For now, we'll show all conversations since we don't have role information
    // In a real implementation, you'd filter based on user roles
    return conversations;
  }, [conversations, activeFilter]);

  const filteredConversationsForDisplay = getFilteredConversations();

  // Get counts for filter tabs
  const getCounts = useCallback(() => {
    const total = conversations.length;
    const creators = conversations.filter(c => c.fan.role === 'CREATOR').length;
    const consumers = conversations.filter(c => c.fan.role === 'CONSUMER').length;
    return { total, creators, consumers };
  }, [conversations]);

  const counts = getCounts();

  // Socket connection and event handling
  useEffect(() => {
    if (!currentUserId || !currentUserName) return;

    const socket = getSocket();
    if (!socket.connected) {
      connectSocket();
      setSocketAuth(currentUserId);
    }

    const handleNewMessage = (data: { message: MessageWithSender; conversationId: string }) => {
      setChats(prevChats => {
        const chatIndex = prevChats.findIndex(c => c.id === data.conversationId);
        if (chatIndex === -1) return prevChats;

        const updatedChats = [...prevChats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: data.message,
          unreadCount: activeChat?.id === data.conversationId 
            ? 0 
            : (updatedChats[chatIndex].unreadCount || 0) + 1
        };
        return updatedChats;
      });

      if (activeChat?.id === data.conversationId) {
        handleSetMessages(prev => [...prev, data.message]);
      }
    };

    const handleConversationUpdate = (updatedConversation: any) => {
      // Refresh conversations from parent component
    };

    const handleMessagesRead = (data: { type: 'conversation' | 'community', id: string }) => {
      setChats(prevChats => prevChats.map(c => 
        c.id === data.id && c.type === data.type ? { ...c, unreadCount: 0 } : c
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdate);
    socket.on('messages_read_update', handleMessagesRead);
    socket.on('connect', () => console.log('Socket connected:', socket.id));

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdate);
      socket.off('messages_read_update', handleMessagesRead);
      if (socket.connected) {
        disconnectSocket();
      }
    };
  }, [currentUserId, currentUserName, activeChat, handleSetMessages]);

  // Join/leave conversation rooms
  useEffect(() => {
    const socket = getSocket();
    
    if (activeChat && activeChat.type === 'conversation') {
      socket.emit('join_conversation', { conversationId: activeChat.id });
    }

    return () => {
      if (activeChat && activeChat.type === 'conversation') {
        socket.emit('leave_conversation', { conversationId: activeChat.id });
      }
    };
  }, [activeChat]);

  return (
    <div className="flex h-full">
      {/* Left Panel - Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeFilter === 'all'
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            All
            <Badge className={cn(
              "ml-2 text-xs",
              activeFilter === 'all' ? "bg-white text-purple-600" : "bg-gray-200 text-gray-600"
            )}>
              {counts.total}
            </Badge>
          </button>
          <button
            onClick={() => setActiveFilter('creators')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeFilter === 'creators'
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            Creators
            <Badge className={cn(
              "ml-2 text-xs",
              activeFilter === 'creators' ? "bg-white text-purple-600" : "bg-gray-200 text-gray-600"
            )}>
              {counts.creators}
            </Badge>
          </button>
          <button
            onClick={() => setActiveFilter('consumers')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeFilter === 'consumers'
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            Consumers
            <Badge className={cn(
              "ml-2 text-xs",
              activeFilter === 'consumers' ? "bg-white text-purple-600" : "bg-gray-200 text-gray-600"
            )}>
              {counts.consumers}
            </Badge>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversationsForDisplay.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">No conversations yet</p>
              <p className="text-xs mt-1 text-gray-500">Start a conversation with your fans</p>
            </div>
          ) : (
            filteredConversationsForDisplay.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={cn(
                  "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all duration-200",
                  selectedConversation?.id === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                    {conversation.fan.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.fan.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {conversation.fan.lastSeen ? "Last seen recently" : "Active now"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            currentUserId={currentUserId}
            messages={convertedMessages}
            setMessages={handleSetMessages}
            onResolveChatId={handleResolveChatId}
          />
        ) : (
          <>
            {/* Empty State Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Select a chat</h2>
            </div>

            {/* Empty State Content */}
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
                <p className="font-semibold text-gray-600">Start a conversation</p>
                <p className="text-sm text-gray-500 mt-1">Send a message to get started</p>
              </div>
            </div>

            {/* Empty State Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Input
                  placeholder="Select a user to start chatting"
                  disabled
                  className="flex-1 bg-gray-100 border-gray-200"
                />
                <button
                  disabled
                  className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 