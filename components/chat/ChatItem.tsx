'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatListItem } from '@/lib/types/shared';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatItemProps {
  chat: ChatListItem;
  isActive: boolean;
  onSelectChat: (chat: ChatListItem) => void;
  currentUserId?: string;
}

function getChatName(chat: ChatListItem, currentUserId?: string): string {
  if (chat.type === 'conversation') {
    return chat.otherUser.name ?? 'Unknown User';
  }
  return chat.name;
}

function getAvatarUrl(chat: ChatListItem): string | undefined {
  if (chat.type === 'conversation') {
    return chat.otherUser.image ?? undefined;
  }
  return chat.imageUrl ?? undefined;
}

export const ChatItem = ({ chat, isActive, onSelectChat, currentUserId }: ChatItemProps) => {
  const lastMessage = chat.lastMessage;
  const unreadCount = chat.unreadCount;
  const name = getChatName(chat, currentUserId);
  const avatarUrl = getAvatarUrl(chat);

  return (
    <div
      onClick={() => onSelectChat(chat)}
      className={cn(
        'flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
        isActive && 'bg-blue-100 dark:bg-blue-900/50'
      )}
    >
      <Avatar className="h-12 w-12 mr-4">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold truncate">{name}</h3>
          {lastMessage && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex justify-between items-start">
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {lastMessage ? lastMessage.content : 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}; 