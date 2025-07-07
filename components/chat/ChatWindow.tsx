'use client';

import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatListItem, MessageWithSender } from '@/lib/types/shared';
import { getSocket } from '@/lib/socket-client';

export interface ChatWindowProps {
  chat: ChatListItem | null;
  currentUserId?: string;
  messages: MessageWithSender[];
  setMessages: Dispatch<SetStateAction<MessageWithSender[]>>;
}

export function ChatWindow({ chat, currentUserId, messages, setMessages }: ChatWindowProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/${chat.id}?type=${chat.type}`);
        if (!res.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data: MessageWithSender[] = await res.json();
        setMessages(data);
      } catch (error) {
        console.error(error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chat, setMessages]);

  const handleSendMessage = (content: string) => {
    if (!chat || !currentUserId || !content.trim()) return;

    const socket = getSocket();
    const eventName = chat.type === 'conversation' ? 'send_message' : 'send_community_message';
    const payload = {
      content,
      [chat.type === 'conversation' ? 'conversationId' : 'communityId']: chat.id,
    };
    
    socket.emit(eventName, payload);
  };
  
  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <ChatHeader chat={chat} />
      <MessageList messages={messages} currentUserId={currentUserId} loading={loading} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
} 