import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [TRIAL-API] Starting trial check');
    
    const { userId, creatorId, createTrial } = await request.json();

    console.log('🔍 [TRIAL-API] Request data:', { userId, creatorId, createTrial });

    if (!userId || !creatorId) {
      console.error('❌ [TRIAL-API] Missing required fields');
      return NextResponse.json({ error: 'Missing userId or creatorId' }, { status: 400 });
    }

    // If user is checking their own creator profile, they have "trial access"
    if (userId === creatorId) {
      console.log('✅ [TRIAL-API] Creator viewing own profile - auto-granted');
      return NextResponse.json({ hasActiveTrial: true });
    }

    // Get creator's current trial settings
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
      select: { 
        subscriptionType: true, 
        trialDuration: true,
        subscriptionPrice: true 
      }
    });

    console.log('📄 [TRIAL-API] Creator profile:', creatorProfile);

    if (!creatorProfile || creatorProfile.subscriptionType !== 'trial') {
      console.log('❌ [TRIAL-API] Creator does not offer trial subscriptions');
      return NextResponse.json({ hasActiveTrial: false });
    }

    // Check for existing trial
    let trialSubscription = await prisma.trialSubscription.findFirst({
      where: {
        userId,
        creatorId,
      },
    });

    console.log('🔍 [TRIAL-API] Existing trial:', trialSubscription ? 'Found' : 'None');

    // If trial exists, check for duration mismatch with creator's current settings
    if (trialSubscription && creatorProfile.trialDuration) {
      const currentSettingMinutes = creatorProfile.trialDuration === 1 ? 1 : creatorProfile.trialDuration * 24 * 60;
      const existingTrialMinutes = Math.round((trialSubscription.expiresAt.getTime() - trialSubscription.startedAt.getTime()) / (1000 * 60));
      
      console.log('🔍 [TRIAL-API] Duration mismatch check:', {
        creatorCurrentSetting: creatorProfile.trialDuration === 1 ? '1 minute' : `${creatorProfile.trialDuration} days`,
        expectedMinutes: currentSettingMinutes,
        existingTrialMinutes: existingTrialMinutes,
        mismatchTolerance: '5 minutes'
      });

      // If duration doesn't match creator's current setting, delete old trial
      if (Math.abs(currentSettingMinutes - existingTrialMinutes) > 5) { // 5 minute tolerance
        console.log('🗑️ [TRIAL-API] Duration mismatch detected - deleting old trial to allow new one with current settings');
        await prisma.trialSubscription.delete({
          where: { id: trialSubscription.id }
        });
        trialSubscription = null; // Reset so new trial can be created
      }
    }

    // If createTrial is true and no valid trial exists, create one with creator's current duration
    if (createTrial && !trialSubscription && creatorProfile.trialDuration) {
      console.log('🎁 [TRIAL-API] Creating new trial subscription with creator\'s current duration settings');
      
      // Calculate expiration based on creator's current trial duration
      const trialDurationMinutes = creatorProfile.trialDuration === 1 ? 1 : creatorProfile.trialDuration * 24 * 60;
      const expiresAt = new Date(Date.now() + trialDurationMinutes * 60 * 1000);
      
      console.log(`⏰ [TRIAL-API] Trial will expire in ${creatorProfile.trialDuration === 1 ? '1 minute' : creatorProfile.trialDuration + ' days'} at:`, expiresAt);
      
      trialSubscription = await prisma.trialSubscription.create({
        data: {
          userId,
          creatorId,
          startedAt: new Date(),
          expiresAt: expiresAt,
          isExpired: false
        }
      });
      
      console.log('✅ [TRIAL-API] Trial created successfully:', {
        id: trialSubscription.id,
        expiresAt: trialSubscription.expiresAt,
        duration: creatorProfile.trialDuration === 1 ? '1 minute' : creatorProfile.trialDuration + ' days'
      });
    }

    // If trial exists, check if it's expired
    if (trialSubscription) {
      // Check if trial has expired
      const now = new Date();
      const timeExpired = now > trialSubscription.expiresAt;
      const dbExpired = trialSubscription.isExpired;
      const isExpired = timeExpired || dbExpired;
      
      // Determine if it was cancelled (manually marked as expired) vs naturally expired
      const isCancelled = dbExpired && !timeExpired; // If marked as expired but time hasn't passed
      const isNaturallyExpired = timeExpired; // If time passed, it's naturally expired regardless of db flag
      
      // Update isExpired flag in database if trial has naturally expired (for consistency)
      if (timeExpired && !dbExpired) {
        await prisma.trialSubscription.update({
          where: { id: trialSubscription.id },
          data: { isExpired: true }
        });
      }

      console.log('🔍 [CHECK-TRIAL] Trial status:', {
        timeExpired,
        dbExpired,
        isExpired,
        isCancelled,
        isNaturallyExpired,
        expiresAt: trialSubscription.expiresAt,
        now
      });

      // For naturally expired trials, treat them as active (auto-pay converts to paid)
      // For manually cancelled trials, treat them as expired
      const hasActiveTrial = !isCancelled; // Only cancelled trials are considered inactive

      return NextResponse.json({
        hasActiveTrial: hasActiveTrial,
        expired: isCancelled, // Only cancelled trials are considered expired
        isCancelled: isCancelled,
        isNaturallyExpired: isNaturallyExpired,
        expiresAt: trialSubscription.expiresAt,
        startedAt: trialSubscription.startedAt
      });
    }

    const hasActiveTrial = !!trialSubscription;
    console.log('🔍 [TRIAL-API] Trial result:', hasActiveTrial ? 'Active' : 'None');

    return NextResponse.json({ 
      hasActiveTrial,
      expiresAt: trialSubscription?.expiresAt,
      trialDuration: creatorProfile.trialDuration
    });
  } catch (error) {
    console.error('❌ [TRIAL-API] Error checking trial:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 