import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from 'next-auth/jwt';
// import { getAuthUser } from "@/lib/auth"; // Uncomment and use real auth in production

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");

  // Extract user from NextAuth JWT
  const jwtUser = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'Ishan' });
  if (!jwtUser || typeof jwtUser.id !== 'string' || !jwtUser.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = jwtUser.id;

  if (!creatorId) {
    return NextResponse.json({ message: "Missing creatorId in query" }, { status: 400 });
  }

  if (userId === creatorId) {
    return NextResponse.json({ subscribed: true });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      creatorId,
    },
  });

  return NextResponse.json({ subscribed: !!subscription });
}

// Add POST method for frontend compatibility
export async function POST(req: NextRequest) {
  try {
    const { userId, creatorId } = await req.json();

    console.log('🔍 Subscription check POST - userId:', userId, 'creatorId:', creatorId);

    if (!userId || !creatorId) {
      return NextResponse.json({ error: "Missing userId or creatorId" }, { status: 400 });
    }

    // If user is checking their own creator profile, they are "subscribed"
    if (userId === creatorId) {
      console.log('✅ Creator viewing own profile - auto-subscribed');
      return NextResponse.json({ subscribed: true });
    }

    // Check if subscription exists
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorId,
      },
    });

    const isSubscribed = !!subscription;
    console.log('🔍 Subscription found:', isSubscribed ? 'Yes' : 'No');

    return NextResponse.json({ subscribed: isSubscribed });
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 