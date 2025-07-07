import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ creatorId: userId }, { fanId: userId }],
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        // Include the other participant's details
        creator: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
        },
        fan: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
        },
        // Include the last message for the preview
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        // Include the count of unread messages for the current user
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false,
              },
            },
          },
        },
      },
    });

    // Format the data to match the frontend's expectations
    const formattedConversations = conversations.map((conv) => {
      const lastMessage = conv.messages[0];
      const otherUser = conv.creatorId === userId ? conv.fan : conv.creator;

      return {
        id: conv.id,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          avatarUrl: otherUser.profile?.avatarUrl,
          // We would need a real-time presence system for isOnline
          isOnline: false, 
        },
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageTime: lastMessage?.createdAt.toISOString() || conv.lastMessageAt.toISOString(),
        unreadCount: conv._count.messages,
      };
    });

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 