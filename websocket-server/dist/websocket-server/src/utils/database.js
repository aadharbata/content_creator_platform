"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseUtils = exports.disconnectDatabase = exports.checkDatabaseConnection = exports.prisma = void 0;
const logger_1 = require("./logger");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
exports.prisma = prisma_1.default;
const checkDatabaseConnection = async () => {
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
        logger_1.logger.info('Database connection successful');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        return false;
    }
};
exports.checkDatabaseConnection = checkDatabaseConnection;
const disconnectDatabase = async () => {
    try {
        await prisma_1.default.$disconnect();
        logger_1.logger.info('Database disconnected successfully');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from database:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
exports.databaseUtils = {
    async getUserById(id) {
        return await prisma_1.default.user.findUnique({
            where: { id },
            include: {
                profile: {
                    select: {
                        avatarUrl: true
                    }
                }
            }
        });
    },
    async getConversationWithAccess(conversationId, userId) {
        return await prisma_1.default.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [
                    { creatorId: userId },
                    { fanId: userId }
                ]
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        profile: {
                            select: {
                                avatarUrl: true
                            }
                        }
                    }
                },
                fan: {
                    select: {
                        id: true,
                        name: true,
                        profile: {
                            select: {
                                avatarUrl: true
                            }
                        }
                    }
                }
            }
        });
    },
    async getUserConversations(userId, isCreator) {
        const whereClause = isCreator
            ? { creatorId: userId }
            : { fanId: userId };
        return await prisma_1.default.conversation.findMany({
            where: whereClause,
            include: {
                fan: {
                    select: {
                        id: true,
                        name: true,
                        profile: {
                            select: {
                                avatarUrl: true
                            }
                        }
                    }
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        profile: {
                            select: {
                                avatarUrl: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                isRead: false,
                                senderId: {
                                    not: userId
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                lastMessageAt: 'desc'
            }
        });
    },
    async createMessage(data) {
        return await prisma_1.default.$transaction(async (tx) => {
            const message = await tx.message.create({
                data: {
                    content: data.content.trim(),
                    conversationId: data.conversationId,
                    senderId: data.senderId
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profile: {
                                select: {
                                    avatarUrl: true
                                }
                            }
                        }
                    },
                    conversation: {
                        select: {
                            creatorId: true,
                            fanId: true
                        }
                    }
                }
            });
            await tx.conversation.update({
                where: { id: data.conversationId },
                data: { lastMessageAt: new Date() }
            });
            return message;
        });
    },
    async markMessagesAsRead(conversationId, userId) {
        return await prisma_1.default.message.updateMany({
            where: {
                conversationId,
                senderId: {
                    not: userId
                },
                isRead: false
            },
            data: {
                isRead: true
            }
        });
    },
    async getUnreadCount(conversationId, userId) {
        const count = await prisma_1.default.message.count({
            where: {
                conversationId,
                senderId: {
                    not: userId
                },
                isRead: false
            }
        });
        return count;
    },
    async getUserCommunityMemberships(userId) {
        return await prisma_1.default.communityMember.findMany({
            where: { userId },
            select: {
                communityId: true
            }
        });
    },
    async getCommunityMembership(communityId, userId) {
        return await prisma_1.default.communityMember.findUnique({
            where: {
                userId_communityId: {
                    communityId,
                    userId
                }
            }
        });
    },
    async getCommunityWithConversation(communityId) {
        return await prisma_1.default.community.findUnique({
            where: { id: communityId },
            include: {
                conversation: true
            }
        });
    },
    async getCommunityMembers(communityId) {
        return await prisma_1.default.communityMember.findMany({
            where: { communityId },
            select: { userId: true },
        });
    },
    async getCommunityUnreadCount(communityId, userId) {
        const membership = await this.getCommunityMembership(communityId, userId);
        if (!membership)
            return 0;
        return await prisma_1.default.communityMessage.count({
            where: {
                conversation: {
                    communityId,
                },
                createdAt: {
                    gt: membership.lastReadAt,
                },
                NOT: {
                    senderId: userId,
                },
            },
        });
    },
    async createCommunityMessage({ content, communityId, senderId, }) {
        return await prisma_1.default.$transaction(async (tx) => {
            const conversation = await tx.communityConversation.findUnique({
                where: { communityId },
                select: { id: true },
            });
            if (!conversation) {
                throw new Error(`Could not find conversation for community ID: ${communityId}`);
            }
            const conversationId = conversation.id;
            const message = await tx.communityMessage.create({
                data: {
                    content,
                    conversationId,
                    senderId,
                },
                include: {
                    sender: {
                        select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
                    },
                },
            });
            await tx.communityConversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: message.createdAt },
            });
            const flattenedSender = {
                ...message.sender,
                image: message.sender.profile?.avatarUrl,
            };
            const payload = {
                ...message,
                sender: flattenedSender,
                communityId: communityId,
            };
            delete payload.sender.profile;
            return payload;
        });
    },
    async markConversationAsRead(conversationId, userId) {
        return await prisma_1.default.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false,
            },
            data: { isRead: true },
        });
    },
    async markCommunityAsRead(communityId, userId) {
        return await prisma_1.default.communityMember.update({
            where: {
                userId_communityId: {
                    userId,
                    communityId,
                },
            },
            data: { lastReadAt: new Date() },
        });
    }
};
//# sourceMappingURL=database.js.map