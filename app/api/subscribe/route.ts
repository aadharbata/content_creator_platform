import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // --- Simulate user authentication ---
  // In real app, use session/JWT. For now, use getAuthUser (simulate user)
  // For development: hardcoded test user (replace with real user ID as needed)
  const user = { id: 'test-user-id' };
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creatorId } = await req.json();

  // Use prisma.creatorProfile for the CreatorProfile model
  const creator = await prisma.creatorProfile.findUnique({
    where: { id: creatorId },
  });
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  // Dummy payment logic: always succeed

  // Check for existing subscription (findFirst since @@unique is not a unique input)
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      creatorId,
    },
  });
  if (existing) return NextResponse.json({ message: "Already subscribed" });

  // Create subscription
  await prisma.subscription.create({
    data: {
      userId: user.id,
      creatorId,
    },
  });

  return NextResponse.json({ message: "Subscribed successfully" });
} 