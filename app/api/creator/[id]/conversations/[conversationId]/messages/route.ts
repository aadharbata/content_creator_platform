import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id, conversationId } = await params

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id) || !uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    // Verify creator owns this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        creatorId: id
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Mark messages as read (messages from fan to creator)
    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: {
          not: id // Messages from fan
        },
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Format response
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      isRead: msg.isRead,
      sender: {
        id: msg.sender.id,
        name: msg.sender.name,
        avatarUrl: msg.sender.profile?.avatarUrl || null
      },
      isFromCreator: msg.senderId === id
    }))

    return NextResponse.json(formattedMessages)

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id, conversationId } = await params
    const body = await request.json()
    const { content } = body

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id) || !uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    // Verify creator owns this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        creatorId: id
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Create message and update conversation
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: content.trim(),
          conversationId: conversationId,
          senderId: id
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        }
      }),
      prisma.conversation.update({
        where: {
          id: conversationId
        },
        data: {
          lastMessageAt: new Date()
        }
      })
    ])

    // Format response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      isRead: message.isRead,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        avatarUrl: message.sender.profile?.avatarUrl || null
      },
      isFromCreator: true
    }

    return NextResponse.json(formattedMessage, { status: 201 })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 