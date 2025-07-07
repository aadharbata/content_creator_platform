export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Community {
  id: string;
  name: string;
  iconUrl: string;
  memberCount: number;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: User;
}

const currentUser: User = { id: 'user-0', name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', isOnline: true };
const user1: User = { id: 'user-1', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', isOnline: true };
const user2: User = { id: 'user-2', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f', isOnline: false };
const user3: User = { id: 'user-3', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704a', isOnline: true };

export const dummyConversations: Conversation[] = [
  {
    id: 'conv-1',
    user: user1,
    lastMessage: 'Hey, are you free for a call?',
    lastMessageTime: '10:42 AM',
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    user: user2,
    lastMessage: 'Thanks for sending the file!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
  },
];

export const dummyCommunities: Community[] = [
  {
    id: 'comm-1',
    name: 'React Developers',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    memberCount: 128,
  },
  {
    id: 'comm-2',
    name: 'Next.js Fans',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
    memberCount: 42,
  },
];

export const dummyMessages: { [key: string]: Message[] } = {
  'conv-1': [
    { id: 'msg-1-1', content: 'Hey, how is it going?', timestamp: '10:40 AM', sender: user1 },
    { id: 'msg-1-2', content: 'Pretty good, just working on the new chat UI.', timestamp: '10:41 AM', sender: currentUser },
    { id: 'msg-1-3', content: 'Hey, are you free for a call?', timestamp: '10:42 AM', sender: user1 },
  ],
  'conv-2': [
    { id: 'msg-2-1', content: 'Here is the file you requested.', timestamp: 'Yesterday', sender: currentUser },
    { id: 'msg-2-2', content: 'Thanks for sending the file!', timestamp: 'Yesterday', sender: user2 },
  ],
  'comm-1': [
    { id: 'msg-c1-1', content: 'Has anyone tried the new React 19 features?', timestamp: '9:00 AM', sender: user3 },
    { id: 'msg-c1-2', content: 'Yes! The automatic batching is a game changer.', timestamp: '9:05 AM', sender: user1 },
    { id: 'msg-c1-3', content: 'I am still catching up, what is the best resource to learn?', timestamp: '9:06 AM', sender: currentUser },
  ],
  'comm-2': [
    { id: 'msg-c2-1', content: 'What do you all think of the latest Next.js conference?', timestamp: '11:00 AM', sender: user2 },
  ]
}; 