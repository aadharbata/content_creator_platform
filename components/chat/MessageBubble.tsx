'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageWithSender } from '@/lib/types/shared';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
}

export const MessageBubble = ({ message, isOwnMessage }: MessageBubbleProps) => {
  const senderName = message.sender.name ?? 'Unknown';

  return (
    <div className={cn('flex items-end gap-2', isOwnMessage ? 'justify-end' : 'justify-start')}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.image ?? undefined} alt={senderName} />
          <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-md lg:max-w-xl p-3 rounded-lg',
          isOwnMessage
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
        )}
      >
        {!isOwnMessage && (
          <p className="text-xs font-semibold mb-1 text-blue-400">{senderName}</p>
        )}
        <p className="text-sm">{message.content}</p>
        <p className="text-xs text-right mt-1 opacity-75">
          {format(new Date(message.createdAt), 'p')}
        </p>
      </div>
    </div>
  );
}; 