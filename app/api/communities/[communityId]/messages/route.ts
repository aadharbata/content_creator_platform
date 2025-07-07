import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'


// GET /api/communities/[communityId]/messages - Get community messages
export async function GET(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { communityId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // For cursor-based pagination
    const skip = (page - 1) * limit

    // Check if user is a member of the community
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: userId,
          communityId
        }
      }
    })

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      )
    }

    // Get community conversation
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        conversation: {
          select: { id: true }
        }
      }
    })

    if (!community?.conversation) {
      return NextResponse.json(
        { error: 'Community conversation not found' },
        { status: 404 }
      )
    }

    // Build where clause for messages
    const whereClause: any = {
      conversationId: community.conversation.id
    }

    // Add cursor-based pagination if before parameter is provided
    if (before) {
      whereClause.createdAt = {
        lt: new Date(before)
      }
    }

    // Get messages
    const messages = await prisma.communityMessage.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: { avatarUrl: true }
            }
          }
        },

      },
      orderBy: { createdAt: 'desc' },
      skip: before ? 0 : skip,
      take: limit
    })

    // Get total count for pagination (only if not using cursor-based)
    let totalMessages = 0
    if (!before) {
      totalMessages = await prisma.communityMessage.count({
        where: whereClause
      })
    }

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: before ? null : {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching community messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community messages' },
      { status: 500 }
    )
  }
}

// POST /api/communities/[communityId]/messages - Send message to community
export async function POST(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { communityId } = params
    const body = await request.json()
    const { content } = body

    // Validate message content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message content too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Check if user is a member of the community and not muted
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: userId,
          communityId
        }
      }
    })

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      )
    }



    // Get community conversation
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        conversation: {
          select: { id: true }
        }
      }
    })

    if (!community?.conversation) {
      return NextResponse.json(
        { error: 'Community conversation not found' },
        { status: 404 }
      )
    }

    const conversationId = community.conversation.id;

    // Create message
    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.communityMessage.create({
        data: {
          content: content.trim(),
          conversationId: conversationId,
          senderId: userId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: {
                select: { avatarUrl: true }
              }
            }
          }
        }
      })

      // Update conversation last message time
      await tx.communityConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      })

      // Update user's last active time
      await tx.communityMember.update({
        where: {
          userId_communityId: {
            userId: userId,
            communityId
          }
        },
        data: { lastActive: new Date() }
      })

      return newMessage
    })

    return NextResponse.json({ message }, { status: 201 })

  } catch (error) {
    console.error('Error sending community message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

 