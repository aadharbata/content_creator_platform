import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get creators from User table where role is CREATOR and IsLive is true
    const creators = await prisma.user.findMany({
      where: {
        role: 'CREATOR',
        creatorProfile: {
          IsLive: true
        }
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
            subscribers: true
          }
        }
      },
      orderBy: {
        subscribers: {
          _count: 'desc'
        }
      },
      take: 50 // Limit to 50 live creators
    });

    // Transform the data to include handles and format for frontend
    const transformedCreators = creators.map(creator => ({
      id: creator.id,
      name: creator.name,
      handle: `@${creator.name.replace(/\s+/g, '')}`,
      avatar: creator.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=random`,
      bio: creator.profile?.bio || 'Content creator and influencer',
      website: creator.profile?.website,
      instagram: creator.profile?.instagram,
      twitter: creator.profile?.twitter,
      subscriberCount: creator._count.subscribers,
      subscribed: false // Will be updated based on current user's subscriptions
    }));

    console.log("TransformedCreators for live: ", transformedCreators);

    return NextResponse.json({
      success: true,
      creators: transformedCreators
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching live creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live creators' },
      { status: 500 }
    );
  }
}

// POST method removed - creator creation is handled through user signup 