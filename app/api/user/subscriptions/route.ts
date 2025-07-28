import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [USER-SUBSCRIPTIONS] Starting request...');
    const session = await getServerSession(authOptions);
    console.log('🔍 [USER-SUBSCRIPTIONS] Session:', session ? 'Found' : 'Not found');

    if (!session?.user) {
      console.log('❌ [USER-SUBSCRIPTIONS] No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    console.log('🔍 [USER-SUBSCRIPTIONS] Fetching subscriptions for user:', userId);

    // Fetch paid subscriptions
    console.log('🔍 [USER-SUBSCRIPTIONS] Fetching paid subscriptions...');
    const paidSubscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('✅ [USER-SUBSCRIPTIONS] Found paid subscriptions:', paidSubscriptions.length);

    // Fetch trial subscriptions
    console.log('🔍 [USER-SUBSCRIPTIONS] Fetching trial subscriptions...');
    const trialSubscriptions = await prisma.trialSubscription.findMany({
      where: { userId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('✅ [USER-SUBSCRIPTIONS] Found trial subscriptions:', trialSubscriptions.length);

    // Process paid subscriptions
    const processedPaidSubscriptions = paidSubscriptions.map((sub) => ({
      id: sub.id,
      creatorId: sub.creatorId,
      creator: {
        id: sub.creator.id,
        name: sub.creator.name,
        avatar: sub.creator.profile?.avatarUrl || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.creator.name || "U")}&background=random`,
      },
      startedAt: sub.createdAt,
      type: 'paid',
      status: 'active',
    }));

    // Process trial subscriptions with remaining time calculation
    const now = new Date();
    const processedTrialSubscriptions = trialSubscriptions.map((trial) => {
      const timeRemaining = trial.expiresAt.getTime() - now.getTime();
      const timeExpired = timeRemaining <= 0;
      const dbExpired = trial.isExpired;
      
      // Determine if it was cancelled (manually marked as expired) vs naturally expired
      const isCancelled = dbExpired && !timeExpired; // If marked as expired but time hasn't passed
      const isNaturallyExpired = timeExpired; // If time passed, it's naturally expired regardless of db flag
      
      // For naturally expired trials, we treat them as active (auto-pay will handle conversion)
      // Only manually cancelled trials should be marked as expired
      const isExpired = isCancelled; // Only cancelled trials are considered expired
      
      let remainingTimeText = '';
      if (!timeExpired) {
        const remainingHours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const remainingDays = Math.floor(remainingHours / 24);
        
        if (remainingDays > 0) {
          remainingTimeText = `${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
        } else if (remainingHours > 0) {
          remainingTimeText = `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
        } else {
          remainingTimeText = `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
        }
      }

      console.log(`🔍 [TRIAL-DEBUG] Trial ${trial.id} for creator ${trial.creator.name}:`, {
        timeExpired,
        dbExpired,
        isCancelled,
        isNaturallyExpired,
        expiresAt: trial.expiresAt,
        now,
        timeRemaining: timeRemaining / (1000 * 60 * 60 * 24) // days remaining
      });

      return {
        id: trial.id,
        creatorId: trial.creatorId,
        creator: {
          id: trial.creator.id,
          name: trial.creator.name,
          avatar: trial.creator.profile?.avatarUrl || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(trial.creator.name || "U")}&background=random`,
        },
        startedAt: trial.startedAt,
        expiresAt: trial.expiresAt,
        type: 'trial',
        status: isExpired ? 'expired' : 'active',
        isCancelled: isCancelled,
        isNaturallyExpired: isNaturallyExpired,
        remainingTime: remainingTimeText,
        timeRemaining: Math.max(0, timeRemaining),
        // Add flag to indicate if this should be treated as a paid subscription
        shouldBePaid: isNaturallyExpired
      };
    });

    // Filter out trials for creators where user has paid subscriptions
    const paidCreatorIds = new Set(processedPaidSubscriptions.map(sub => sub.creatorId));
    const filteredTrialSubscriptions = processedTrialSubscriptions.filter(trial =>
      !paidCreatorIds.has(trial.creatorId)
    );

    // Separate naturally expired trials (should be treated as paid) from active/cancelled trials
    const naturallyExpiredTrials = filteredTrialSubscriptions.filter(trial => trial.shouldBePaid);
    const activeAndCancelledTrials = filteredTrialSubscriptions.filter(trial => !trial.shouldBePaid);

    // Add naturally expired trials to paid subscriptions (treating them as paid due to auto-pay)
    const allPaidSubscriptions = [
      ...processedPaidSubscriptions,
      ...naturallyExpiredTrials.map(trial => ({
        id: trial.id,
        creatorId: trial.creatorId,
        creator: trial.creator,
        startedAt: trial.startedAt,
        type: 'paid',
        status: 'active',
        isFromTrial: true, // Flag to indicate this was converted from trial
        originalExpiresAt: trial.expiresAt
      }))
    ];

    console.log('✅ [USER-SUBSCRIPTIONS] Found subscriptions:', {
      paid: allPaidSubscriptions.length,
      trials: activeAndCancelledTrials.length,
      naturallyExpiredAsPaid: naturallyExpiredTrials.length,
      filteredOut: processedTrialSubscriptions.length - filteredTrialSubscriptions.length
    });

    return NextResponse.json({
      paidSubscriptions: allPaidSubscriptions,
      trialSubscriptions: activeAndCancelledTrials,
    });
  } catch (error) {
    console.error('❌ [USER-SUBSCRIPTIONS] Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 