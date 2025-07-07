import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

// GET /api/communities/[communityId]/members - Get all members of a community
export async function GET(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { communityId } = params

    // Optional: Check if the user is a member of the community before allowing them to see the member list
    const isMember = await prisma.communityMember.findFirst({
        where: {
            userId: userId,
            communityId: communityId,
        }
    });

    if (!isMember) {
        return NextResponse.json({ error: 'You are not a member of this community.'}, { status: 403});
    }

    const members = await prisma.communityMember.findMany({
      where: { communityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: { avatarUrl: true },
            },
          },
        },
      },
    })
    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching community members:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST /api/communities/[communityId]/members - Add a member to a community
export async function POST(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { communityId } = params
    const body = await request.json()
    const { userId: userIdToAdd } = body

    if (!userIdToAdd) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Find the community and verify the current user is the owner
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        creatorId: currentUserId,
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found or you are not the owner' },
        { status: 404 }
      )
    }

    // Check if user to add exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userIdToAdd },
    });

    if (!userToAdd) {
        return NextResponse.json({ error: 'User to add not found'}, { status: 404 });
    }

    // Add the user to the community
    const member = await prisma.communityMember.create({
      data: {
        communityId: communityId,
        userId: userIdToAdd,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding community member:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// DELETE /api/communities/[communityId]/members - Remove a member
export async function DELETE(
    request: NextRequest,
    { params }: { params: { communityId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const currentUserId = (session?.user as any)?.id;
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { communityId } = params;
        const { searchParams } = new URL(request.url);
        const userIdToRemove = searchParams.get('userId'); // ID of member to remove

        if (!userIdToRemove) {
            return NextResponse.json({ error: 'userId of member to remove is required' }, { status: 400 });
        }

        const community = await prisma.community.findUnique({
            where: { id: communityId },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Only the creator can remove others. Members can only remove themselves.
        if (currentUserId !== userIdToRemove && community.creatorId !== currentUserId) {
            return NextResponse.json({ error: 'Forbidden: You can only remove yourself or be removed by the creator.' }, { status: 403 });
        }

        const deletedMembership = await prisma.communityMember.delete({
            where: {
                userId_communityId: {
                    userId: userIdToRemove,
                    communityId: communityId,
                },
            },
        });

        return NextResponse.json(deletedMembership);

    } catch (error) {
        console.error('Error removing community member:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 