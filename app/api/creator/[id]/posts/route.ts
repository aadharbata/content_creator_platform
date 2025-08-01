import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Try to get user from session first (cookie-based auth)
  const session = await getServerSession(authOptions);
  let userId: string | null = null;
  
  if (session?.user) {
    const sessionUser = session.user as { id?: string; role?: string };
    userId = sessionUser.id || null;
  }
  
  // If no session, try JWT token (fallback)
  if (!userId) {
    const jwtUser = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'Ishan' });
    if (jwtUser && typeof jwtUser.id === 'string' && jwtUser.id) {
      userId = jwtUser.id;
    }
  }
  
  // Check if the requesting user is the creator themselves
  const isOwnPosts = userId === id;
  
  // If it's the creator viewing their own posts, allow access without authentication
  // Otherwise, require authentication for subscription checks
  if (!isOwnPosts && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First, find the CreatorProfile for the given User ID
  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: {
      userId: id
    }
  });

  if (!creatorProfile) {
    return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
  }

  let isSubscribed = false;
  
  // Only check subscription if it's not the creator's own posts
  if (!isOwnPosts && userId) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        creatorId: id,
        userId: userId,
      },
    });
    isSubscribed = !!subscription;
  }

  const posts = await prisma.post.findMany({
    where: {
      creatorId: creatorProfile.id, // Use CreatorProfile.id instead of User.id
      // If it's the creator viewing their own posts, show all posts
      // Otherwise, filter based on subscription status
      isPaidOnly: isOwnPosts ? undefined : (isSubscribed ? undefined : false),
    },
    include: {
      media: true,
      likes: true,
      comments: {
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      },
      tip: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          tip: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ posts, isSubscribed: isOwnPosts ? true : isSubscribed })
} 