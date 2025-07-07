import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';

// GET /api/conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch existing conversations for this user
    const existingConversations = await prisma.conversation.findMany({
      where: {
        OR: [{ creatorId: userId }, { fanId: userId }],
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        creator: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
        },
        fan: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
          },
        },
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

    // 2. Determine counterpart user IDs from subscriptions without conversations
    let counterpartIds: string[] = [];
    if (userRole === 'CREATOR') {
      const subs = await prisma.subscription.findMany({
        where: { creatorId: userId },
        select: { userId: true },
      });
      counterpartIds = subs.map((s) => s.userId);
    } else {
      // Assume CONSUMER/FAN
      const subs = await prisma.subscription.findMany({
        where: { userId: userId },
        select: { creatorId: true },
      });
      counterpartIds = subs.map((s) => s.creatorId);
    }

    // Remove counterparts that already have a conversation
    const existingCounterpartIds = new Set<string>();
    for (const conv of existingConversations) {
      const otherId = conv.creatorId === userId ? conv.fanId : conv.creatorId;
      existingCounterpartIds.add(otherId);
    }

    const missingIds = counterpartIds.filter((id) => !existingCounterpartIds.has(id));

    // 3. Fetch user profiles for missing counterparts to form placeholder conversations
    let placeholders: any[] = [];
    if (missingIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
      });

      placeholders = users.map((u) => ({
        id: `placeholder-${u.id}`,
        creatorId: userRole === 'CREATOR' ? userId : u.id,
        fanId: userRole === 'CREATOR' ? u.id : userId,
        lastMessageAt: new Date(),
        lastMessage: undefined,
        otherUser: {
          id: u.id,
          name: u.name,
          image: u.profile?.avatarUrl ?? null,
        },
        unreadCount: 0,
        type: 'conversation' as const,
        placeholder: true,
      }));
    }

    // 4. Format existing conversations to match frontend expectation
    const formattedExisting = existingConversations.map((conv) => {
      const lastMsg = conv.messages[0];
      const other = conv.creatorId === userId ? conv.fan : conv.creator;
      return {
        id: conv.id,
        lastMessage: lastMsg
          ? {
              ...lastMsg,
              sender: {
                id: lastMsg.sender.id,
                name: lastMsg.sender.name,
                image: lastMsg.sender.profile?.avatarUrl ?? null,
              },
            }
          : undefined,
        otherUser: {
          id: other.id,
          name: other.name,
          image: other.profile?.avatarUrl ?? null,
        },
        unreadCount: conv._count.messages,
        type: 'conversation' as const,
      };
    });

    const allConversations = [...formattedExisting, ...placeholders].sort(
      (a, b) => b.lastMessageAt?.getTime?.() - a.lastMessageAt?.getTime?.()
    );

    return NextResponse.json(allConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 