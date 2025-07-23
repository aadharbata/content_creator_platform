import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, creatorId } = await request.json();

    console.log('🔍 Trial check - userId:', userId, 'creatorId:', creatorId);

    if (!userId || !creatorId) {
      return NextResponse.json({ error: 'Missing userId or creatorId' }, { status: 400 });
    }

    // Get creator's subscription settings
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
      select: {
        subscriptionType: true,
        trialDuration: true,
        subscriptionPrice: true,
      },
    });

    console.log('📄 Creator profile:', creatorProfile);

    // If creator doesn't offer trials, return false
    if (!creatorProfile || creatorProfile.subscriptionType !== 'trial') {
      console.log('❌ Creator does not offer trial subscriptions');
      return NextResponse.json({ hasActiveTrial: false });
    }

    // Check if user has an existing trial subscription
    const existingTrial = await prisma.trialSubscription.findUnique({
      where: {
        userId_creatorId: {
          userId: userId,
          creatorId: creatorId,
        },
      },
    });

    console.log('🔍 Existing trial:', existingTrial);

    if (!existingTrial) {
      // No trial exists, create a new one
      const trialDurationValue = creatorProfile.trialDuration || 1;
      const expiresAt = new Date();
      
      // Handle different duration units
      if (trialDurationValue === 1) {
        // 1 minute for testing
        expiresAt.setMinutes(expiresAt.getMinutes() + 1);
        console.log(`🎁 Creating new trial subscription for 1 minute (testing mode)`);
      } else {
        // Days for normal operation (7, 14 or 30)
        expiresAt.setDate(expiresAt.getDate() + trialDurationValue);
        console.log(`🎁 Creating new trial subscription for ${trialDurationValue} days`);
      }

      const newTrial = await prisma.trialSubscription.create({
        data: {
          userId: userId,
          creatorId: creatorId,
          expiresAt: expiresAt,
          startedAt: new Date(),
        },
      });

      console.log('✅ Created new trial subscription:', newTrial);
      return NextResponse.json({ 
        hasActiveTrial: true,
        isNewTrial: true,
        trialExpiresAt: newTrial.expiresAt,
      });
    }

    // MOVED DURATION MISMATCH CHECK BEFORE EXPIRY CHECK
    // Check if existing trial duration matches creator's current setting
    const currentTrialDuration = creatorProfile.trialDuration || 1;
    
    // Calculate how long the existing trial was supposed to last (in minutes)
    const trialStartTime = new Date(existingTrial.startedAt).getTime();
    const trialEndTime = new Date(existingTrial.expiresAt).getTime();
    const existingTrialDurationInMinutes = Math.floor((trialEndTime - trialStartTime) / (1000 * 60));
    
    // Expected duration based on current creator settings
    const expectedDurationInMinutes = currentTrialDuration === 1 ? 1 : (currentTrialDuration * 24 * 60);
    
    console.log('🔍 Duration check:', {
      currentTrialDuration,
      existingTrialDurationInMinutes,
      expectedDurationInMinutes,
      shouldDelete: existingTrialDurationInMinutes > expectedDurationInMinutes * 2
    });

    // If existing trial duration doesn't match current setting (with 2x tolerance), delete it and create new one
    if (existingTrialDurationInMinutes > expectedDurationInMinutes * 2) {
      console.log('🔄 Duration mismatch detected - deleting old trial and creating new one');
      console.log(`Old trial: ${existingTrialDurationInMinutes} minutes, Expected: ${expectedDurationInMinutes} minutes`);
      
      // Delete the old trial
      await prisma.trialSubscription.delete({
        where: { id: existingTrial.id },
      });

      // Create a new trial with correct duration
      const expiresAt = new Date();
      if (currentTrialDuration === 1) {
        expiresAt.setMinutes(expiresAt.getMinutes() + 1);
        console.log(`🎁 Creating new 1-minute trial (testing mode)`);
      } else {
        expiresAt.setDate(expiresAt.getDate() + currentTrialDuration);
        console.log(`🎁 Creating new ${currentTrialDuration}-day trial`);
      }

      const newTrial = await prisma.trialSubscription.create({
        data: {
          userId: userId,
          creatorId: creatorId,
          expiresAt: expiresAt,
          startedAt: new Date(),
        },
      });

      console.log('✅ Created new trial after duration mismatch:', newTrial);
      return NextResponse.json({ 
        hasActiveTrial: true,
        isNewTrial: true,
        trialExpiresAt: newTrial.expiresAt,
      });
    }

    // NOW check if trial is expired
    const now = new Date();
    const isExpired = now > existingTrial.expiresAt;

    console.log('🔍 Trial expiry check:', {
      now: now.toISOString(),
      expiresAt: existingTrial.expiresAt.toISOString(),
      isExpired: isExpired,
    });

    if (isExpired) {
      // Mark trial as expired if not already marked
      if (!existingTrial.isExpired) {
        await prisma.trialSubscription.update({
          where: { id: existingTrial.id },
          data: { isExpired: true },
        });
        console.log('⏰ Trial marked as expired');
      }

      console.log('❌ Trial has expired');
      return NextResponse.json({ 
        hasActiveTrial: false,
        trialExpiresAt: existingTrial.expiresAt,
      });
    }

    // Trial exists and is still active
    console.log('✅ Trial is still active');
    return NextResponse.json({ 
      hasActiveTrial: true,
      isNewTrial: false,
      trialExpiresAt: existingTrial.expiresAt,
    });

  } catch (error) {
    console.error('❌ Error checking trial subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 