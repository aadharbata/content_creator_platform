import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id;
  const myRole = (session?.user as any)?.role;

  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { otherUserId } = await req.json();
  if (!otherUserId || typeof otherUserId !== 'string') {
    return NextResponse.json({ error: 'Invalid otherUserId' }, { status: 400 });
  }

  const creatorId = myRole === 'CREATOR' ? me : otherUserId;
  const fanId = myRole === 'CREATOR' ? otherUserId : me;

  try {
    const conv = await prisma.conversation.upsert({
      where: { creatorId_fanId: { creatorId, fanId } },
      update: {},
      create: { creatorId, fanId },
    });
    return NextResponse.json({ id: conv.id });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 