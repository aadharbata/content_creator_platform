import prisma from '../../../lib/prisma';
export { prisma };
export declare const checkDatabaseConnection: () => Promise<boolean>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const databaseUtils: {
    getUserById(id: string): Promise<({
        profile: {
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        phone: string | null;
        phoneVerified: boolean;
        role: import("../../../lib/generated/prisma").$Enums.Role;
        StripeCustomerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    getConversationWithAccess(conversationId: string, userId: string): Promise<({
        creator: {
            id: string;
            name: string;
            profile: {
                avatarUrl: string | null;
            } | null;
        };
        fan: {
            id: string;
            name: string;
            profile: {
                avatarUrl: string | null;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        fanId: string;
        lastMessageAt: Date;
    }) | null>;
    getUserConversations(userId: string, isCreator: boolean): Promise<({
        _count: {
            messages: number;
        };
        creator: {
            id: string;
            name: string;
            profile: {
                avatarUrl: string | null;
            } | null;
        };
        fan: {
            id: string;
            name: string;
            profile: {
                avatarUrl: string | null;
            } | null;
        };
        messages: {
            content: string;
            senderId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isRead: boolean;
            conversationId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        fanId: string;
        lastMessageAt: Date;
    })[]>;
    createMessage(data: {
        content: string;
        conversationId: string;
        senderId: string;
    }): Promise<any>;
    markMessagesAsRead(conversationId: string, userId: string): Promise<import("../../../lib/generated/prisma").Prisma.BatchPayload>;
    getUnreadCount(conversationId: string, userId: string): Promise<number>;
    getUserCommunityMemberships(userId: string): Promise<{
        communityId: string;
    }[]>;
    getCommunityMembership(communityId: string, userId: string): Promise<{
        communityId: string;
        id: string;
        userId: string;
        joinedAt: Date;
        lastActive: Date | null;
        lastReadAt: Date;
    } | null>;
    getCommunityWithConversation(communityId: string): Promise<({
        conversation: {
            communityId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lastMessageAt: Date;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        description: string | null;
        type: string;
        maxMembers: number;
        contentId: string | null;
    }) | null>;
    getCommunityMembers(communityId: string): Promise<{
        userId: string;
    }[]>;
    getCommunityUnreadCount(communityId: string, userId: string): Promise<number>;
    createCommunityMessage({ content, communityId, senderId, }: {
        content: string;
        communityId: string;
        senderId: string;
    }): Promise<{
        sender: {
            image: string | null | undefined;
            id: string;
            name: string;
            profile: {
                avatarUrl: string | null;
            } | null;
        };
        communityId: string;
        content: string;
        senderId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        conversationId: string;
    }>;
    markConversationAsRead(conversationId: string, userId: string): Promise<import("../../../lib/generated/prisma").Prisma.BatchPayload>;
    markCommunityAsRead(communityId: string, userId: string): Promise<{
        communityId: string;
        id: string;
        userId: string;
        joinedAt: Date;
        lastActive: Date | null;
        lastReadAt: Date;
    }>;
};
//# sourceMappingURL=database.d.ts.map