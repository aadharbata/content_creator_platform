import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get messages for a room
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    // Get messages for this room using the DirectMessage model
    const messages = await prisma.directMessage.findMany({
      where: {
        roomId: roomId
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      messages: messages.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        senderId: msg.senderId,
        senderName: msg.sender.name,
        timestamp: msg.createdAt
      }))
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

// Save a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, content } = body;

    if (!roomId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save message to database using DirectMessage model
    const message = await prisma.directMessage.create({
      data: {
        content: content,
        roomId: roomId,
        senderId: (session.user as any).id
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: {
        id: message.id,
        text: message.content,
        senderId: message.senderId,
        senderName: message.sender.name,
        timestamp: message.createdAt
      }
    });

  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 