import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    console.log('🔍 Subscription settings GET - Session:', session?.user);
    console.log('🔍 Subscription settings GET - Requested ID:', id);

    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify that the user is requesting their own creator profile
    const sessionUserId = (session.user as any)?.id;
    console.log('🔍 Session user ID:', sessionUserId);
    console.log('🔍 Requested creator ID:', id);
    
    if (sessionUserId !== id) {
      console.log('❌ Authorization failed: user trying to access another creator\'s settings');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('✅ Authorization passed, fetching subscription settings');

    // Fetch creator profile with subscription settings
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
      console.log('📝 No creator profile found, creating default settings');
      // Create creator profile if it doesn't exist
      const newProfile = await prisma.creatorProfile.create({
        data: {
          userId: id,
          isPaid: false,
          subscriptionPrice: null,
          subscriptionType: 'free', // Changed from 'paid' to 'free' for new creators
          trialDuration: null,
        },
      });
      
      return NextResponse.json({
        subscriptionType: 'free', // Changed from 'paid' to 'free' for new creators
        subscriptionPrice: null,
        trialDuration: 1, // Changed from 7 to 1 for testing
      });
    }

    console.log('✅ Found existing creator profile:', creatorProfile);

    // Convert the database format to UI format
    const responseData = {
      subscriptionType: creatorProfile.subscriptionType || 'free', // Changed fallback from 'paid' to 'free'
      subscriptionPrice: creatorProfile.subscriptionPrice || 0,
      trialDuration: creatorProfile.trialDuration || 7,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching subscription settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    console.log('🔄 Subscription settings POST - Session:', session?.user);
    console.log('🔄 Subscription settings POST - Requested ID:', id);

    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify that the user is updating their own creator profile
    const sessionUserId = (session.user as any)?.id;
    console.log('🔍 Session user ID:', sessionUserId);
    console.log('🔍 Requested creator ID:', id);
    
    if (sessionUserId !== id) {
      console.log('❌ Authorization failed: user trying to update another creator\'s settings');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('🔄 Request body:', body);

    const { subscriptionType, subscriptionPrice, trialDuration } = body;

    // Validate the subscription type
    if (!['paid', 'free', 'trial'].includes(subscriptionType)) {
      return NextResponse.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    // Validate trial duration if it's a trial subscription
    if (subscriptionType === 'trial' && ![1, 7, 14, 30].includes(trialDuration)) {
      console.log('❌ Invalid trial duration:', trialDuration, 'Valid options: [1, 7, 14, 30]');
      return NextResponse.json({ error: 'Invalid trial duration. Valid options: 1 minute, 7 days, 14 days, 30 days' }, { status: 400 });
    }

    console.log('✅ Authorization passed, updating subscription settings');

    // Update or create creator profile
    const updatedProfile = await prisma.creatorProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        isPaid: subscriptionType === 'paid' || subscriptionType === 'trial',
        subscriptionPrice: (subscriptionType === 'paid' || subscriptionType === 'trial') ? subscriptionPrice : null,
        subscriptionType: subscriptionType,
        trialDuration: subscriptionType === 'trial' ? trialDuration : null,
      },
      update: {
        isPaid: subscriptionType === 'paid' || subscriptionType === 'trial',
        subscriptionPrice: (subscriptionType === 'paid' || subscriptionType === 'trial') ? subscriptionPrice : null,
        subscriptionType: subscriptionType,
        trialDuration: subscriptionType === 'trial' ? trialDuration : null,
      },
    });

    console.log('✅ Subscription settings updated successfully:', updatedProfile);

    return NextResponse.json({ 
      success: true,
      subscriptionType: updatedProfile.subscriptionType,
      subscriptionPrice: updatedProfile.subscriptionPrice,
      trialDuration: updatedProfile.trialDuration,
    });
  } catch (error) {
    console.error('❌ Error updating subscription settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 