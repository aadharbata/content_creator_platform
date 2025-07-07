import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  type: z.enum(['conversation', 'community']),
  id: z.string().uuid(),
});

export async function GET(request: NextRequest, { params }: { params: { chatId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const awaitedParams = await params;
  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse({
    type: searchParams.get('type'),
    id: awaitedParams.chatId,
  });

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { type, id } = parseResult.data;

  try {
    let messages: any[];
    if (type === 'conversation') {
      // Security check: ensure user is part of the conversation
      const conversation = await prisma.conversation.findFirst({
        where: { id, OR: [{ creatorId: userId }, { fanId: userId }] },
      });
      if (!conversation) {
        // No conversation yet – return empty history instead of an error
        return NextResponse.json([]);
      }

      messages = await prisma.message.findMany({
        where: { conversationId: id },
        include: { 
          sender: { 
            select: { 
              id: true, 
              name: true, 
              profile: { select: { avatarUrl: true } } 
            } 
          } 
        },
        orderBy: { createdAt: 'asc' },
        take: 50, // Add pagination later
      });
    } else { // type === 'community'
      // Security check: ensure user is a member of the community
      const member = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId: id } },
      });
      if (!member) {
        return NextResponse.json({ error: 'Community not found or access denied' }, { status: 404 });
      }
      messages = await prisma.communityMessage.findMany({
        where: {
          conversation: {
            communityId: id,
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
    }

    // We need to flatten the response so the frontend doesn't need to know about the nested profile
    const flattenedMessages = messages.map(message => ({
      ...message,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        image: message.sender.profile?.avatarUrl,
      },
    }));

    return NextResponse.json(flattenedMessages);
  } catch (error) {
    console.error(`Failed to fetch messages for ${type} ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}