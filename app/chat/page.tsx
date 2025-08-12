"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { getSocket, connectSocket, disconnectSocket, setSocketAuth } from '@/lib/socket-client';
import type { Conversation, Community, ChatListItem, MessageWithSender } from '@/lib/types/shared';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const currentUserName = (session?.user as any)?.name || 'User';
  const searchParams = useSearchParams();

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [activeChat, setActiveChat] = useState<ChatListItem | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);

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

      // If a specific chat was requested, make it active once present
      if (pendingChatId) {
        const found = allChats.find(c => c.id === pendingChatId);
        if (found) {
          setActiveChat(found);
          setPendingChatId(null);
        }
      } else if (allChats.length > 0 && !activeChat) {
        setActiveChat(allChats[0]);
      }

    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [activeChat, pendingChatId]);

  // Ensure socket connects with the real logged-in identity
  useEffect(() => {
    if (!currentUserId) return;
    const socket = getSocket();

    // Set auth for handshake before connecting
    setSocketAuth({ userId: currentUserId, userName: currentUserName });
    if (!socket.connected) connectSocket();

    const handleNewMessage = (newMessage: MessageWithSender) => {
      // Update the main chat list
      setChats(prevChats => {
        const chatIndex = prevChats.findIndex(c => 
          (c.type === 'conversation' && c.id === (newMessage as any).conversationId) ||
          (c.type === 'community' && c.id === (newMessage as any).communityId)
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
        (activeChat?.type === 'conversation' && (activeChat as any).id === (newMessage as any).conversationId) ||
        (activeChat?.type === 'community' && (activeChat as any).id === (newMessage as any).communityId)
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
  }, [currentUserId, currentUserName, activeChat, fetchChats]);

  // If navigated with ?to=<userId>, create or open the conversation and activate it
  useEffect(() => {
    const to = searchParams?.get('to');
    if (!currentUserId || !to) return;

    (async () => {
      try {
        const res = await fetch('/api/conversations/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otherUserId: to })
        });
        if (!res.ok) return;
        const { id } = await res.json();
        setPendingChatId(id);
        await fetchChats();
        // Join the conversation room proactively
        const socket = getSocket();
        socket.emit('join_conversation', { conversationId: id });
      } catch (e) {
        console.error('Failed to open conversation from query param:', e);
      }
    })();
  }, [currentUserId, searchParams, fetchChats]);

  // Join/leave the active conversation room so receiver gets messages in real time
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeChat) return;

    if (activeChat.type === 'conversation' && !(activeChat as any).placeholder) {
      socket.emit('join_conversation', { conversationId: activeChat.id });
      return () => {
        socket.emit('leave_conversation', { conversationId: activeChat.id });
      };
    }
  }, [activeChat]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

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