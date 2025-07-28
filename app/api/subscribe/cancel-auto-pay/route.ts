import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [CANCEL-AUTO-PAY] Starting auto-pay cancellation');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ [CANCEL-AUTO-PAY] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const { creatorId, trialId } = await request.json();

    console.log('🔍 [CANCEL-AUTO-PAY] Request data:', { userId, creatorId, trialId });

    if (!creatorId || !trialId) {
      console.error('❌ [CANCEL-AUTO-PAY] Missing required fields');
      return NextResponse.json({ error: 'Missing creatorId or trialId' }, { status: 400 });
    }

    // Verify the trial belongs to the user
    const trialSubscription = await prisma.trialSubscription.findFirst({
      where: {
        id: trialId,
        userId: userId,
        creatorId: creatorId,
      }
    });

    console.log('🔍 [CANCEL-AUTO-PAY] Found trial subscription:', trialSubscription ? 'Yes' : 'No');

    if (!trialSubscription) {
      console.log('❌ [CANCEL-AUTO-PAY] Trial not found or does not belong to user');
      return NextResponse.json({ error: 'Trial not found' }, { status: 404 });
    }

    // Mark the trial as expired
    const updatedTrial = await prisma.trialSubscription.update({
      where: { id: trialId },
      data: { 
        isExpired: true // Mark as expired so user sees subscription box
      }
    });

    console.log('✅ [CANCEL-AUTO-PAY] Auto-pay cancelled successfully for trial:', trialId);
    console.log('✅ [CANCEL-AUTO-PAY] Updated trial:', updatedTrial);

    return NextResponse.json({ 
      success: true, 
      message: 'Auto-pay cancelled successfully',
      trialId: trialId,
      creatorId: creatorId
    });

  } catch (error) {
    console.error('❌ [CANCEL-AUTO-PAY] Error cancelling auto-pay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 