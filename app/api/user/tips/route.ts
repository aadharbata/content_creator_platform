import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID not found' },
        { status: 401 }
      );
    }

    // Fetch all tips made by this user and group by postId to get cumulative amounts
    const tips = await prisma.tip.findMany({
      where: {
        userId: userId
      },
      select: {
        postId: true,
        amount: true
      }
    });

    // Group tips by postId and sum the amounts
    const cumulativeTips = tips.reduce((acc, tip) => {
      if (acc[tip.postId]) {
        acc[tip.postId] += tip.amount;
      } else {
        acc[tip.postId] = tip.amount;
      }
      return acc;
    }, {} as { [key: string]: number });

    return NextResponse.json({
      success: true,
      tips: Object.entries(cumulativeTips).map(([postId, amount]) => ({
        postId,
        amount
      }))
    });

  } catch (error) {
    console.error('Error fetching user tips:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 