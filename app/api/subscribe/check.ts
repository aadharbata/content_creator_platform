import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // For development: hardcoded test user (replace with real user ID as needed)
  const user = { id: 'test-user-id' };

  const { creatorId } = await req.json();
  if (!creatorId) return NextResponse.json({ subscribed: false });

  // Debug: log userId and creatorId
  console.log('Checking subscription for user:', user.id, 'creator:', creatorId);

  // Check for existing subscription
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      creatorId,
    },
  });

  // Debug: log result
  console.log('Subscription found:', !!existing);

  return NextResponse.json({ subscribed: !!existing });
} 