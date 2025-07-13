import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Extract user from NextAuth JWT
  const jwtUser = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'Ishan' });
  if (!jwtUser || typeof jwtUser.id !== 'string' || !jwtUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = jwtUser.id;

  const subscription = await prisma.subscription.findFirst({
    where: {
      creatorId: id,
      userId: userId,
    },
  });

  const isSubscribed = !!subscription;

  const posts = await prisma.post.findMany({
    where: {
      creatorId: id,
      isPaidOnly: isSubscribed ? undefined : false,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ posts, isSubscribed })
} 