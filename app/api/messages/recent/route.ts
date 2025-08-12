import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const meId = (session?.user as any)?.id as string | undefined;

    if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch latest messages involving this user, most recent first
    const latest = await prisma.directMessage.findMany({
      where: { roomId: { contains: meId } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, content: true, roomId: true, createdAt: true }
    });

    // Pick the first message per room (it's already sorted by createdAt desc)
    const seenRooms = new Set<string>();
    const recents: Array<{ roomId: string; lastText: string; lastAt: Date; targetUserId: string }> = [];

    for (const msg of latest) {
      if (seenRooms.has(msg.roomId)) continue;
      seenRooms.add(msg.roomId);
      const parts = msg.roomId.replace(/^dm_/, "").split("_");
      const targetUserId = parts.find((p) => p !== meId) || "";
      recents.push({ roomId: msg.roomId, lastText: msg.content, lastAt: msg.createdAt, targetUserId });
    }

    // Fetch target user names in one query
    const uniqueUserIds = Array.from(new Set(recents.map(r => r.targetUserId).filter(Boolean)));
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, name: true, profile: { select: { avatarUrl: true } } }
    });
    const idToUser = new Map(users.map(u => [u.id, u]));

    const payload = recents.map(r => ({
      roomId: r.roomId,
      lastText: r.lastText,
      lastAt: r.lastAt,
      targetUserId: r.targetUserId,
      targetUserName: idToUser.get(r.targetUserId)?.name || r.targetUserId,
      targetUserAvatar: idToUser.get(r.targetUserId)?.profile?.avatarUrl || null,
    }));

    return NextResponse.json({ success: true, recents: payload });
  } catch (error) {
    console.error("Error fetching recent DMs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 