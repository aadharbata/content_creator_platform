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