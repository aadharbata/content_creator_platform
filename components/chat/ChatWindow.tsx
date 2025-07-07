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
  onResolveChatId: (oldId: string, newId: string) => void;
}

export function ChatWindow({ chat, currentUserId, messages, setMessages, onResolveChatId }: ChatWindowProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat) return;
      if (chat.type === 'conversation' && (chat as any).placeholder) {
        setMessages([]);
        return;
      }
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

  const handleSendMessage = async (content: string) => {
    if (!chat || !currentUserId || !content.trim()) return;

    let conversationId = chat.id;
    if (chat.type === 'conversation' && (chat as any).placeholder) {
      // request real conversation id
      const res = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: chat.otherUser.id }),
      });
      if (res.ok) {
        const { id: newId } = await res.json();
        onResolveChatId(chat.id, newId);
        conversationId = newId;
      } else {
        console.error('Failed to start conversation');
        return;
      }
    }

    const socket = getSocket();
    const eventName = chat.type === 'conversation' ? 'send_message' : 'send_community_message';
    const payload = chat.type === 'conversation'
      ? { conversationId, content }
      : { communityId: chat.id, content };

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