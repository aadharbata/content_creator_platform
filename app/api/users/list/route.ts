import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const take = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
    const cursor = searchParams.get("cursor") || undefined

    const users = await prisma.user.findMany({
      where: {
        NOT: { id: (session.user as any).id }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: { select: { avatarUrl: true } }
      },
      orderBy: { name: "asc" },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    })

    const nextCursor = users.length === take ? users[users.length - 1].id : null

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.profile?.avatarUrl || null,
        handle: u.email?.split("@")[0] || null
      })),
      nextCursor
    })
  } catch (err) {
    console.error("/api/users/list error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 