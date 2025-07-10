'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatListItem } from '@/lib/types/shared';
import { Users, Hash } from 'lucide-react';

interface ChatHeaderProps {
  chat: ChatListItem;
}

function getChatName(chat: ChatListItem): string {
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

function getSubTitle(chat: ChatListItem): string {
    if (chat.type === 'community') {
        return `${chat._count?.members || 0} members`;
    }
    // Placeholder for presence status
    return 'Online'; 
}

export const ChatHeader = ({ chat }: ChatHeaderProps) => {
  const name = getChatName(chat);
  const avatarUrl = getAvatarUrl(chat);
  const subtitle = getSubTitle(chat);

  return (
    <div className="flex items-center p-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <Avatar className="h-10 w-10 mr-4">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h2 className="font-semibold text-white">{name}</h2>
        <div className="flex items-center text-sm text-gray-400">
          {chat.type === 'community' 
            ? <Hash className="w-4 h-4 mr-1" /> 
            : <Users className="w-4 h-4 mr-1" />
          }
          <span>{subtitle}</span>
        </div>
      </div>
       {/* Placeholder for action buttons like call, search, etc. */}
    </div>
  );
}; 