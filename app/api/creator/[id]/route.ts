import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const creator = await prisma.user.findUnique({
      where: {
        id: id,
        role: "CREATOR"
      },
      include: {
        profile: true
      }
    })

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(creator)
  } catch (error) {
    console.error("Error fetching creator:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 