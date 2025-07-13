import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "Ishan" });
    if (!token || typeof token.id !== "string" || !token.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorProfile = await prisma.creatorProfile.findUnique({
        where: {
            userId: token.id,
        }
    });

    if (!creatorProfile){
        console.log("CreatorProfile not found with token id: ", token.id);
        return NextResponse.json({message: "CreatorProfile Not Found"}, {status: 404});
    }
    const creatorId = creatorProfile.userId
    // Only allow the creator to update their own profile
    if (token.id !== creatorId) {
        console.log("Token id: ", token.id);
        console.log("CreatorId: ", creatorProfile.id);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const updated = await prisma.creatorProfile.update({
      where: { userId: creatorId },
      data: { IsLive: true },
    });
    return NextResponse.json({ success: true, creator: updated });
  } catch {
    return NextResponse.json({ error: "Failed to go live" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "Ishan" });
    if (!token || typeof token.id !== "string" || !token.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorProfile = await prisma.creatorProfile.findUnique({
        where: {
            userId: token.id,
        }
    });

    if (!creatorProfile){
        console.log("CreatorProfile not found with token id: ", token.id);
        return NextResponse.json({message: "CreatorProfile Not Found"}, {status: 404});
    }
    const creatorId = creatorProfile.userId
    // Only allow the creator to update their own profile
    if (token.id !== creatorId) {
        console.log("Token id: ", token.id);
        console.log("CreatorId: ", creatorProfile.id);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const updated = await prisma.creatorProfile.update({
      where: { userId: creatorId },
      data: { IsLive: false },
    });
    return NextResponse.json({ success: true, creator: updated });
  } catch {
    return NextResponse.json({ error: "Failed to stop live" }, { status: 500 });
  }
} 