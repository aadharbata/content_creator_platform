'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageWithSender } from '@/lib/types/shared';

export interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId?: string;
  loading: boolean;
}

export function MessageList({ messages, currentUserId, loading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col gap-4">
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            message={msg}
            isOwnMessage={msg.sender.id === currentUserId}
          />
        ))}
      </div>
    </div>
  );
} 