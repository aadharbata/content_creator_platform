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
        enableFreeTrial: false,
      });
    }

    console.log('✅ Found creator profile:', creatorProfile);

    // Determine if free trial is enabled based on subscription type
    // Handle legacy 'trial' type by converting it to 'paid' with enableFreeTrial
    const isTrialType = creatorProfile.subscriptionType === 'trial';
    const enableFreeTrial = isTrialType || (creatorProfile.subscriptionType === 'paid' && creatorProfile.trialDuration !== null);
    const actualSubscriptionType = isTrialType ? 'paid' : creatorProfile.subscriptionType;

    // Return subscription settings for public viewing
    const responseData = {
      subscriptionType: actualSubscriptionType || 'paid',
      isPaid: creatorProfile.isPaid,
      subscriptionPrice: creatorProfile.subscriptionPrice,
      trialDuration: creatorProfile.trialDuration,
      enableFreeTrial: enableFreeTrial,
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