import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  return NextResponse.json({ test: "subscribe route works (GET)" });
}

export async function POST(req: NextRequest) {
  const { creatorId, userId } = await req.json();

  // Debug: log userId and creatorId
  console.log('POST /api/subscribe:', { userId, creatorId });

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if creator exists and is a CREATOR
  const creator = await prisma.user.findUnique({ where: { id: creatorId } });
  if (!creator || creator.role !== "CREATOR") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // Check if subscription exists
  const existing = await prisma.subscription.findFirst({
    where: { userId, creatorId },
  });
  if (existing) {
    return NextResponse.json({ alreadySubscribed: true });
  }

  // Create subscription
  await prisma.subscription.create({
    data: { userId, creatorId },
  });
  return NextResponse.json({ subscribed: true });
} 