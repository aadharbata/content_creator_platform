import { ChatItem } from './ChatItem';
import { ChatListItem } from '@/lib/types/shared';

export interface ChatSidebarProps {
  chats: ChatListItem[];
  activeChat: ChatListItem | null;
  onSelectChat: (chat: ChatListItem) => void;
  currentUserId?: string;
}

export function ChatSidebar({ chats, activeChat, onSelectChat, currentUserId }: ChatSidebarProps) {
  return (
    <div className="w-1/4 min-w-[280px] bg-gray-900/70 backdrop-blur-md border-r border-white/10 flex flex-col text-gray-200">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Messages</h2>
        {/* Placeholder for future search bar */}
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No chats yet.</div>
        ) : (
          chats.map((chat) => (
            <ChatItem
              key={`${chat.type}-${chat.id}`}
              chat={chat}
              isActive={activeChat?.id === chat.id}
              onSelectChat={onSelectChat}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
} 