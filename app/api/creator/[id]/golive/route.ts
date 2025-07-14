import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Only allow the creator to update their own profile
    if (userId !== id) {
      console.log("Session user ID:", userId);
      console.log("Creator ID from URL:", id);
      return NextResponse.json({ error: "Forbidden - You can only manage your own livestream" }, { status: 403 });
    }

    // Find the creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: {
        userId: id,
      }
    });

    if (!creatorProfile) {
      console.log("CreatorProfile not found for user ID:", id);
      return NextResponse.json({ message: "CreatorProfile Not Found" }, { status: 404 });
    }

    // Update the live status
    const updated = await prisma.creatorProfile.update({
      where: { userId: id },
      data: { IsLive: true } as any,
    });

    console.log("✅ Creator went live successfully:", id);
    return NextResponse.json({ success: true, creator: updated });
  } catch (error) {
    console.error("❌ Failed to go live:", error);
    return NextResponse.json({ error: "Failed to go live" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Only allow the creator to update their own profile
    if (userId !== id) {
      console.log("Session user ID:", userId);
      console.log("Creator ID from URL:", id);
      return NextResponse.json({ error: "Forbidden - You can only manage your own livestream" }, { status: 403 });
    }

    // Find the creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: {
        userId: id,
      }
    });

    if (!creatorProfile) {
      console.log("CreatorProfile not found for user ID:", id);
      return NextResponse.json({ message: "CreatorProfile Not Found" }, { status: 404 });
    }

    // Update the live status to false
    const updated = await prisma.creatorProfile.update({
      where: { userId: id },
      data: { IsLive: false } as any,
    });

    console.log("✅ Creator stopped live successfully:", id);
    return NextResponse.json({ success: true, creator: updated });
  } catch (error) {
    console.error("❌ Failed to stop live:", error);
    return NextResponse.json({ error: "Failed to stop live" }, { status: 500 });
  }
} 