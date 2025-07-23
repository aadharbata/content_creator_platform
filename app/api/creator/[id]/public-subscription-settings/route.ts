import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('🔍 Public subscription settings GET - Creator ID:', id);

    // Fetch creator profile with subscription settings (no auth required for public view)
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: id },
      select: {
        isPaid: true,
        subscriptionPrice: true,
        subscriptionType: true,
        trialDuration: true,
      },
    });

    if (!creatorProfile) {
      console.log('📝 No creator profile found, returning default settings');
      // If no creator profile exists, return default settings (paid model)
      return NextResponse.json({
        subscriptionType: 'paid',
        isPaid: true,
        subscriptionPrice: 0,
        trialDuration: null,
      });
    }

    console.log('✅ Found creator profile:', creatorProfile);

    // Return subscription settings for public viewing
    const responseData = {
      subscriptionType: creatorProfile.subscriptionType || 'paid',
      isPaid: creatorProfile.isPaid,
      subscriptionPrice: creatorProfile.subscriptionPrice,
      trialDuration: creatorProfile.trialDuration,
    };

    console.log('📤 Returning public subscription data:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching public subscription settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 