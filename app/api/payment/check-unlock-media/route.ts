import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const jwtUser = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'Ishan' });
    if (!jwtUser || typeof jwtUser.id !== 'string' || !jwtUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = jwtUser.id;
    const { postId } = await req.json();

    // Find the first media for this post
    const media = await prisma.postMedia.findFirst({ where: { postId } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check if already unlocked
    const existing = await prisma.payment.findFirst({
      where: { userId, postmediaId: media.id, status: "SUCCEEDED", type: "POST_MEDIA_UNLOCK" }
    });
    if (existing) {
      return NextResponse.json({ success: true, unlocked: true });
    }
    return NextResponse.json({ success: true, unlocked: false });
  } catch (error) {
    console.error("Check Unlock API error:", error);
    return NextResponse.json({ error: "Failed to check unlock status", details: String(error) }, { status: 500 });
  }
} 