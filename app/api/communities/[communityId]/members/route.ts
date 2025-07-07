import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


// GET /api/communities/[communityId]/members - Get community members
export async function GET(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { communityId } = params
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Check if user is a member of the community
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
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

    // Get members with pagination
    const members = await prisma.communityMember.findMany({
      where: {
        communityId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: { avatarUrl: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'asc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const totalMembers = await prisma.communityMember.count({
      where: {
        communityId
      }
    })

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total: totalMembers,
        totalPages: Math.ceil(totalMembers / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching community members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community members' },
      { status: 500 }
    )
  }
}

// POST /api/communities/[communityId]/members - Join community
export async function POST(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { communityId } = params

    // Check if community exists
    const community = await prisma.community.findFirst({
      where: {
        id: communityId
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Check if community is at max capacity
    if (community._count.members >= community.maxMembers) {
      return NextResponse.json(
        { error: 'Community is at maximum capacity' },
        { status: 409 }
      )
    }

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member of this community' },
        { status: 409 }
      )
    }

    // Add user as member
    const membership = await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId
      },
      include: {
        user: {
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

    return NextResponse.json({ membership }, { status: 201 })

  } catch (error) {
    console.error('Error joining community:', error)
    return NextResponse.json(
      { error: 'Failed to join community' },
      { status: 500 }
    )
  }
}

// DELETE /api/communities/[communityId]/members - Leave community
export async function DELETE(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { communityId } = params
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId') // For removing other users

    const userIdToRemove = targetUserId || session.user.id

    // Get user's membership
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
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

    // For now, only allow users to remove themselves
    if (targetUserId && targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only remove yourself from the community' },
        { status: 403 }
      )
    }

    // Remove membership
    await prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId: userIdToRemove,
          communityId
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error leaving community:', error)
    return NextResponse.json(
      { error: 'Failed to leave community' },
      { status: 500 }
    )
  }
} 