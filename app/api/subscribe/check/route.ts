import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { getAuthUser } from "@/lib/auth"; // Uncomment and use real auth in production

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "Missing userId in query" }, { status: 400 });
  }
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