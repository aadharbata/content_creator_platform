import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


// GET /api/communities - Get user's communities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // "CONTENT_COMMUNITY" or "SUBSCRIPTION_COMMUNITY"
    const asCreator = searchParams.get('asCreator') === 'true'

    let communities

    if (asCreator) {
      // Get communities owned by the user
      communities = await prisma.community.findMany({
        where: {
          creatorId: session.user.id,
          ...(type && { type })
        },
        include: {
          _count: {
            select: { members: true }
          },
          content: {
            select: { id: true, title: true, type: true }
          },
          conversation: {
            select: { 
              id: true, 
              lastMessageAt: true,
              _count: { select: { messages: true } }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
    } else {
      // Get communities where user is a member
      communities = await prisma.community.findMany({
        where: {
          members: {
            some: {
              userId: session.user.id
            }
          },
          ...(type && { type })
        },
        include: {
          _count: {
            select: { members: true }
          },
          creator: {
            select: { id: true, name: true, email: true }
          },
          content: {
            select: { id: true, title: true, type: true }
          },
          conversation: {
            select: { 
              id: true, 
              lastMessageAt: true,
              _count: { select: { messages: true } }
            }
          },
          members: {
            where: { userId: session.user.id },
            select: { joinedAt: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })
    }

    return NextResponse.json({ communities })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}

// POST /api/communities - Create a new community
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, contentId, maxMembers = 1000 } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (type && !['CONTENT_COMMUNITY', 'SUBSCRIPTION_COMMUNITY'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid community type' },
        { status: 400 }
      )
    }

    // For content communities, validate content exists and user owns it
    if (type === 'CONTENT_COMMUNITY') {
      if (!contentId) {
        return NextResponse.json(
          { error: 'Content ID is required for content communities' },
          { status: 400 }
        )
      }

      const content = await prisma.content.findFirst({
        where: {
          id: contentId,
          authorId: session.user.id
        }
      })

      if (!content) {
        return NextResponse.json(
          { error: 'Content not found or unauthorized' },
          { status: 404 }
        )
      }

      // Check if community already exists for this content
      const existingCommunity = await prisma.community.findUnique({
        where: { contentId }
      })

      if (existingCommunity) {
        return NextResponse.json(
          { error: 'Community already exists for this content' },
          { status: 409 }
        )
      }
    }

    // For subscription communities, check if one already exists
    if (type === 'SUBSCRIPTION_COMMUNITY') {
      const existingCommunity = await prisma.community.findUnique({
        where: {
          creatorId_type: {
            creatorId: session.user.id,
            type: 'SUBSCRIPTION_COMMUNITY'
          }
        }
      })

      if (existingCommunity) {
        return NextResponse.json(
          { error: 'Subscription community already exists' },
          { status: 409 }
        )
      }
    }

    // Create community with conversation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create community
      const community = await tx.community.create({
        data: {
          name,
          description,
          type,
          contentId: type === 'CONTENT_COMMUNITY' ? contentId : null,
          creatorId: session.user.id,
          maxMembers
        }
      })

      // Create associated community conversation
      const conversation = await tx.communityConversation.create({
        data: {
          communityId: community.id
        }
      })

      // Add creator as member
      await tx.communityMember.create({
        data: {
          userId: session.user.id,
          communityId: community.id
        }
      })

      return { community, conversation }
    })

    return NextResponse.json({
      community: result.community,
      conversationId: result.conversation.id
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    )
  }
} 