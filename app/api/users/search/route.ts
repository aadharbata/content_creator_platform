import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const userId = searchParams.get("id") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    // If searching by exact ID
    if (userId) {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
          NOT: {
            id: (session.user as any).id // Exclude current user
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      return NextResponse.json({ 
        success: true, 
        users: user ? [user] : []
      });
    }

    // If searching by name/email
    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } }
        ],
        NOT: {
          id: (session.user as any).id // Exclude current user
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      take: limit,
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json({ 
      success: true, 
      users 
    });

  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 