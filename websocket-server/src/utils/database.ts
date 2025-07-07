import { Prisma } from '@prisma/client'
import { logger } from './logger'

// Import Prisma client from parent directory
import prisma from '../../../lib/prisma'

// Export the shared prisma instance
export { prisma }

// Database connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    logger.info('Database connection successful')
    return true
  } catch (error) {
    logger.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    logger.info('Database disconnected successfully')
  } catch (error) {
    logger.error('Error disconnecting from database:', error)
  }
}

// Utility functions for common queries
export const databaseUtils = {
  // Check if user exists and get their details
  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          select: {
            avatarUrl: true
          }
        }
      }
    })
  },

  // Check if conversation exists and user has access
  async getConversationWithAccess(conversationId: string, userId: string) {
    return await prisma.conversation.findFirst({
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
    })
  },

  // Get conversations for a user
  async getUserConversations(userId: string, isCreator: boolean) {
    const whereClause = isCreator
      ? { creatorId: userId }
      : { fanId: userId }

    return await prisma.conversation.findMany({
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
    })
  },

  // Create a new message with transaction
  async createMessage(data: {
    content: string
    conversationId: string
    senderId: string
  }) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the message
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
      })

      // Update conversation timestamp
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: new Date() }
      })

      return message
    })
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string) {
    return await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId // Mark messages from other user as read
        },
        isRead: false
      },
      data: {
        isRead: true
      }
    })
  },

  // Get unread count for a conversation and user
  async getUnreadCount(conversationId: string, userId: string) {
    const count = await prisma.message.count({
      where: {
        conversationId,
        senderId: {
          not: userId // Count messages from other user
        },
        isRead: false
      }
    })
    return count
  },

  // Community-related methods
  async getUserCommunityMemberships(userId: string) {
    return await prisma.communityMember.findMany({
      where: { userId },
      select: {
        communityId: true
      }
    })
  },

  async getCommunityMembership(communityId: string, userId: string) {
    return await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          communityId,
          userId
        }
      }
    })
  },

  async getCommunityWithConversation(communityId: string) {
    return await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        conversation: true
      }
    })
  },

  async getCommunityMembers(communityId: string) {
    return await prisma.communityMember.findMany({
      where: { communityId },
      select: { userId: true },
    });
  },

  async getCommunityUnreadCount(communityId: string, userId: string) {
    // Find the user's membership to get their lastReadAt timestamp
    const membership = await this.getCommunityMembership(communityId, userId);
    if (!membership) return 0;

    // Count messages created after the user's lastReadAt time
    return await prisma.communityMessage.count({
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

  async createCommunityMessage({
    content,
    communityId,
    senderId,
  }: {
    content: string;
    communityId: string;
    senderId: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // Step 1: Find the correct CommunityConversation associated with the Community
      const conversation = await tx.communityConversation.findUnique({
        where: { communityId },
        select: { id: true },
      });

      if (!conversation) {
        throw new Error(`Could not find conversation for community ID: ${communityId}`);
      }
      
      const conversationId = conversation.id;

      // Step 2: Create the message within that conversation
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
      
      // Step 3: Update the conversation's last message timestamp
      await tx.communityConversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: message.createdAt },
      });

      // Step 4: Format the payload for the client, ensuring communityId is present
      const flattenedSender = {
          ...message.sender,
          image: message.sender.profile?.avatarUrl,
      };
      
      const payload = {
          ...message,
          sender: flattenedSender,
          communityId: communityId,
      };

      delete (payload.sender as any).profile;
      
      return payload;
    });
  },

  async markConversationAsRead(conversationId: string, userId: string) {
    return await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  },

  async markCommunityAsRead(communityId: string, userId: string) {
    return await prisma.communityMember.update({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      data: { lastReadAt: new Date() },
    });
  }
} 