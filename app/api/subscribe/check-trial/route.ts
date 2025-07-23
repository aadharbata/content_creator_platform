import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [TRIAL-API] Starting trial check - SIMPLE VERSION (like paid)');
    
    const { userId, creatorId, createTrial } = await request.json();

    console.log('🔍 [TRIAL-API] Request data:', { userId, creatorId, createTrial });

    if (!userId || !creatorId) {
      console.error('❌ [TRIAL-API] Missing required fields');
      return NextResponse.json({ error: 'Missing userId or creatorId' }, { status: 400 });
    }

    // If user is checking their own creator profile, they have "trial access"
    if (userId === creatorId) {
      console.log('✅ [TRIAL-API] Creator viewing own profile - auto-granted trial access');
      return NextResponse.json({ hasActiveTrial: true });
    }

    // Check if trial record exists (EXACTLY like paid subscription check)
    let trialSubscription = await prisma.trialSubscription.findFirst({
      where: {
        userId,
        creatorId,
      },
    });

    // If createTrial is true and no trial exists, create one (like paid subscription creation)
    if (createTrial && !trialSubscription) {
      console.log('🎁 [TRIAL-API] Creating new trial subscription (like paid)');
      
      trialSubscription = await prisma.trialSubscription.create({
        data: {
          userId,
          creatorId,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year (irrelevant for now)
          isExpired: false
        }
      });
      
      console.log('✅ [TRIAL-API] Trial created successfully');
    }

    const hasActiveTrial = !!trialSubscription;
    console.log('🔍 [TRIAL-API] Trial found:', hasActiveTrial ? 'Yes' : 'No');

    return NextResponse.json({ hasActiveTrial });
  } catch (error) {
    console.error('❌ [TRIAL-API] Error checking trial:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 