import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get creators from User table where role is CREATOR with their profiles
    // Prioritize creators who have posted content
    const creators = await prisma.user.findMany({
      where: {
        role: 'CREATOR'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true,
            bio: true,
            website: true,
            twitter: true,
            instagram: true
          }
        },
        _count: {
          select: {
            subscribers: true // Count of subscribers for ranking
          }
        },
        creatorProfile: {
          select: {
            _count: {
              select: {
                posts: true // Count of posts for ranking
              }
            }
          }
        }
      },
      orderBy: [
        {
          creatorProfile: {
            posts: {
              _count: 'desc' // Order by most posts first
            }
          }
        },
        {
          subscribers: {
            _count: 'desc' // Then by most subscribed
          }
        },
        {
          createdAt: 'desc' // Then by newest
        }
      ],
      take: 10 // Limit to top 10 creators
    });

    // Transform the data to include handles and format for frontend
    const transformedCreators = creators.map(creator => ({
      id: creator.id,
      name: creator.name,
      handle: `@${creator.name.replace(/\s+/g, '')}`, // Generate handle from name
      avatar: creator.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=random`,
      bio: creator.profile?.bio || 'Content creator and influencer',
      website: creator.profile?.website,
      instagram: creator.profile?.instagram,
      twitter: creator.profile?.twitter,
      subscriberCount: creator._count.subscribers,
      postCount: creator.creatorProfile?._count?.posts || 0,
      subscribed: false // Will be updated based on current user's subscriptions
    }));

    return NextResponse.json({ 
      success: true,
      creators: transformedCreators
    }, {status: 200});

  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

// POST method removed - creator creation is handled through user signup 