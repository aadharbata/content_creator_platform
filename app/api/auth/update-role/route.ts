import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    const { userId, role } = await request.json();

    // Validate required fields
    if (!userId || !role) {
      return NextResponse.json(
        { message: 'User ID and role are required.' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'CREATOR' && role !== 'CONSUMER') {
      return NextResponse.json(
        { message: 'Invalid role. Must be CREATOR or CONSUMER.' },
        { status: 400 }
      );
    }

    // Check if user exists and belongs to the current session
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not found.' },
        { status: 404 }
      );
    }

    // Verify the user making the request is the same user being updated
    if (currentUser.id !== (session.user as any).id) {
      return NextResponse.json(
        { message: 'Unauthorized. You can only update your own role.' },
        { status: 403 }
      );
    }

    console.log(`Updating user role: ${currentUser.email} → ${role}`);

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // If user selected CREATOR role, create/update CreatorProfile
    if (role === 'CREATOR') {
      if (!currentUser.creatorProfile) {
        await prisma.creatorProfile.create({
          data: {
            userId: userId,
            isPaid: false,
            IsLive: false,
          },
        });
        console.log(`✅ CreatorProfile created for user: ${updatedUser.email}`);
      }
    }

    // If user changed from CREATOR to CONSUMER, optionally keep CreatorProfile
    // (They might want to switch back later)

    console.log(`✅ Role updated successfully: ${updatedUser.email} → ${role}`);

    // Note: The isNewUser flag will be reset in the next session refresh
    // This happens automatically when the user navigates after role selection

    return NextResponse.json(
      {
        message: 'Role updated successfully.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
} 