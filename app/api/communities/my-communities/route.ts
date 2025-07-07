import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/communities/my-communities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.communityMember.findMany({
      where: { userId },
      include: {
        community: {
          include: {
            conversation: {
              include: {
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: { sender: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    const formattedCommunities = await Promise.all(
      memberships.map(async ({ community, lastReadAt }) => {
        const conversation = community.conversation;
        if (!conversation) return null; // Should not happen if community has a conversation

        const lastMessage = conversation.messages[0];

        // Perform a separate, efficient count for unread messages
        const unreadCount = await prisma.communityMessage.count({
          where: {
            conversationId: conversation.id,
            createdAt: { gt: lastReadAt },
            NOT: { senderId: userId },
          },
        });

        return {
          id: community.id,
          name: community.name,
          iconUrl: 'https://via.placeholder.com/150', // Replace with actual icon field later
          memberCount: 0, // Placeholder
          lastMessage: lastMessage
            ? `${lastMessage.sender.name}: ${lastMessage.content}`
            : 'No messages yet',
          lastMessageTime: lastMessage?.createdAt.toISOString() || conversation.lastMessageAt.toISOString(),
          unreadCount: unreadCount,
        };
      })
    );
    
    // Filter out any null values that might have occurred
    const result = formattedCommunities.filter(Boolean);
    
    // Sort by lastMessageTime after all data is fetched and formatted
    result.sort((a, b) => new Date(b!.lastMessageTime).getTime() - new Date(a!.lastMessageTime).getTime());

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user communities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 