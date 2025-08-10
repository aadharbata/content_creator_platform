import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, email, avatarUrl } = await request.json();
    const userId = (session.user as any).id;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
      },
    });

    // Update or create user profile with avatar URL
    if (avatarUrl !== undefined) {
      await prisma.userProfile.upsert({
        where: { userId },
        update: { avatarUrl },
        create: {
          userId,
          avatarUrl,
        },
      });
    }

    // Fetch updated profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { avatarUrl: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: userProfile?.avatarUrl || null,
      },
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 