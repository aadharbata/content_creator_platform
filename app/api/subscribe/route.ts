import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET() {
  return NextResponse.json({ test: "subscribe route works (GET)" });
}

export async function POST(req: NextRequest) {
  try {
    // Extract user from NextAuth JWT
    const jwtUser = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'Ishan' });
    if (!jwtUser || typeof jwtUser.id !== 'string' || !jwtUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = jwtUser.id;

    const { creatorId } = await req.json();

    // Debug: log userId and creatorId
    console.log('POST /api/subscribe:', { userId, creatorId });

    if (!creatorId) {
      return NextResponse.json({ error: "Creator ID is required" }, { status: 400 });
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
  } catch (error) {
    console.error("Error in subscribe route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 