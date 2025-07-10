"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket-client';
import type { Conversation, Community, ChatListItem, MessageWithSender } from '@/lib/types/shared';

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [activeChat, setActiveChat] = useState<ChatListItem | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const [conversationsRes, communitiesRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/communities/my-communities'),
      ]);

      if (!conversationsRes.ok || !communitiesRes.ok) {
        throw new Error('Failed to fetch chat data');
      }

      const conversations: Conversation[] = await conversationsRes.json();
      const communities: Community[] = await communitiesRes.json();
      
      const allChats: ChatListItem[] = [
        ...conversations.map(c => ({ ...c, type: 'conversation' as const })),
        ...communities.map(c => ({ ...c, type: 'community' as const })),
      ];
      
      allChats.sort((a, b) => {
          const dateA = new Date(a.lastMessage?.createdAt || 0).getTime();
          const dateB = new Date(b.lastMessage?.createdAt || 0).getTime();
          return dateB - dateA;
      });

      setChats(allChats);
      if (allChats.length > 0 && !activeChat) {
        setActiveChat(allChats[0]);
      }

    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [activeChat]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (currentUserId) {
      const socket = getSocket();

      const handleNewMessage = (newMessage: MessageWithSender) => {
        // Update the main chat list
        setChats(prevChats => {
          const chatIndex = prevChats.findIndex(c => 
            (c.type === 'conversation' && c.id === newMessage.conversationId) ||
            (c.type === 'community' && c.id === newMessage.communityId)
          );

          if (chatIndex === -1) return prevChats;

          const updatedChat = { 
            ...prevChats[chatIndex], 
            lastMessage: newMessage,
            unreadCount: (prevChats[chatIndex].id !== activeChat?.id) 
              ? (prevChats[chatIndex].unreadCount || 0) + 1 
              : 0
          };

          const newChats = [...prevChats];
          newChats[chatIndex] = updatedChat;

          // Move updated chat to the top
          return [updatedChat, ...newChats.filter(c => c.id !== updatedChat.id)];
        });

        // Add to the active chat window if it's the correct one
        if (
          (activeChat?.type === 'conversation' && activeChat.id === newMessage.conversationId) ||
          (activeChat?.type === 'community' && activeChat.id === newMessage.communityId)
        ) {
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }
      };
      
      const handleConversationUpdate = (updatedConversation: Partial<Conversation | Community>) => {
          fetchChats();
      };
      
      const handleMessagesRead = (data: { type: 'conversation' | 'community', id: string }) => {
          setChats(prevChats => prevChats.map(c => 
              c.id === data.id && c.type === data.type ? { ...c, unreadCount: 0 } : c
          ));
      };

      if (!socket.connected) connectSocket();

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
    }
  }, [currentUserId, activeChat, fetchChats]);

  const handleSelectChat = (chat: ChatListItem) => {
    setActiveChat(chat);
    if (chat.unreadCount > 0) {
      const socket = getSocket();
      socket.emit('mark_as_read', { type: chat.type, id: chat.id });
    }
  };

  const handleResolveChatId = (oldId: string, newId: string) => {
    setChats(prev => prev.map(c => c.id === oldId ? { ...c, id: newId, placeholder: false } : c));
    setActiveChat(prev => (prev && prev.id === oldId ? { ...prev, id: newId, placeholder:false } : prev));
  };

  if (loading && chats.length === 0) {
    return <div>Loading chats...</div>;
  }

  return (
    <div className="flex h-screen bg-black">
      <ChatSidebar 
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        currentUserId={currentUserId}
      />
      <ChatWindow 
        chat={activeChat}
        currentUserId={currentUserId}
        messages={messages}
        setMessages={setMessages}
        onResolveChatId={handleResolveChatId}
      />
    </div>
  );
} 