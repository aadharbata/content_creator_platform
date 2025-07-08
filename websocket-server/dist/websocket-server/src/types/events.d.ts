export interface User {
    id: string;
    name: string;
    email: string;
    role: 'CREATOR' | 'CONSUMER' | 'ADMIN';
    profile?: {
        avatarUrl?: string | null;
    };
}
export interface Message {
    id: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
    conversationId: string;
    senderId: string;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}
export interface Conversation {
    id: string;
    creatorId: string;
    fanId: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CommunityConversation {
    id: string;
    communityId: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ConversationWithDetails extends Conversation {
    fan: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
    creator: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
    lastMessage?: {
        content: string;
        createdAt: Date;
        isFromFan: boolean;
    };
    unreadCount: number;
}
export interface ClientToServerEvents {
    join_conversation: (data: {
        conversationId: string;
    }) => void;
    leave_conversation: (data: {
        conversationId: string;
    }) => void;
    send_message: (data: {
        conversationId: string;
        content: string;
    }) => void;
    typing_start: (data: {
        conversationId: string;
    }) => void;
    typing_stop: (data: {
        conversationId: string;
    }) => void;
    mark_as_read: (data: {
        type: 'conversation' | 'community';
        id: string;
    }) => void;
    send_community_message: (data: {
        communityId: string;
        content: string;
    }) => void;
    community_typing_start: (data: {
        communityId: string;
    }) => void;
    community_typing_stop: (data: {
        communityId: string;
    }) => void;
}
export interface ServerToClientEvents {
    message_sent: (data: MessageSentData) => void;
    new_message: (data: NewMessageData) => void;
    message_error: (data: {
        error: string;
        originalContent?: string;
    }) => void;
    conversation_updated: (data: ConversationUpdateData) => void;
    conversations_list: (data: {
        conversations: ConversationWithDetails[];
    }) => void;
    messages_read_update: (data: {
        type: 'conversation' | 'community';
        id: string;
    }) => void;
    user_typing: (data: {
        conversationId: string;
        userId: string;
        userName: string;
    }) => void;
    user_stopped_typing: (data: {
        conversationId: string;
        userId: string;
    }) => void;
    community_message_sent: (data: CommunityMessageSentData) => void;
    community_new_message: (data: CommunityNewMessageData) => void;
    community_user_typing: (data: {
        communityId: string;
        userId: string;
        userName: string;
    }) => void;
    community_user_stopped_typing: (data: {
        communityId: string;
        userId: string;
    }) => void;
    connected: (data: {
        userId: string;
        timestamp: Date;
    }) => void;
    error: (data: {
        message: string;
        code?: string;
    }) => void;
}
export interface MessageSentData {
    id: string;
    content: string;
    createdAt: Date;
    conversationId: string;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
    isFromCreator: boolean;
    isRead: boolean;
}
export interface NewMessageData {
    id: string;
    content: string;
    createdAt: Date;
    conversationId: string;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
    isFromCreator: boolean;
    isRead: boolean;
}
export interface ConversationUpdatedData {
    conversationId: string;
    lastMessage: {
        content: string;
        createdAt: Date;
        isFromFan: boolean;
    };
    lastMessageAt: Date;
    unreadCount?: number;
}
export interface MessagesReadUpdateData {
    conversationId: string;
    readByUserId: string;
    unreadCount: number;
    timestamp: Date;
}
export interface SocketData {
    userId: string;
    userRole: 'CREATOR' | 'CONSUMER' | 'ADMIN';
    userName: string;
}
export interface InterServerEvents {
}
export interface SendMessageRequest {
    conversationId: string;
    content: string;
}
export interface JoinConversationRequest {
    conversationId: string;
}
export interface AuthPayload {
    userId: string;
    role: 'CREATOR' | 'CONSUMER' | 'ADMIN';
    iat: number;
    exp: number;
}
export interface Community {
    id: string;
    name: string;
    description?: string;
    type: string;
    maxMembers: number;
    contentId?: string;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CommunityMember {
    id: string;
    userId: string;
    communityId: string;
    joinedAt: Date;
    lastActive?: Date;
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}
export interface CommunityMessageSentData {
    id: string;
    content: string;
    createdAt: Date;
    conversationId: string;
    communityId: string;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}
export interface CommunityNewMessageData {
    id: string;
    content: string;
    createdAt: Date;
    conversationId: string;
    communityId: string;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}
export interface SendCommunityMessageRequest {
    communityId: string;
    content: string;
}
export interface ConversationUpdateData {
    type: 'conversation' | 'community';
    id: string;
    lastMessage: string;
    lastMessageSender?: string;
    lastMessageTime: string;
    unreadCount: number;
}
//# sourceMappingURL=events.d.ts.map