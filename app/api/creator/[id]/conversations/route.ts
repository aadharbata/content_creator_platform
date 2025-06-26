import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid creator ID format' },
        { status: 400 }
      )
    }

    // Get all conversations for this creator
    const conversations = await prisma.conversation.findMany({
      where: {
        creatorId: id
      },
      include: {
        fan: {
          include: {
            profile: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Get last message for preview
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: {
                  not: id // Count unread messages from fan
                }
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    // Format response
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      fan: {
        id: conv.fan.id,
        name: conv.fan.name,
        avatarUrl: conv.fan.profile?.avatarUrl || null
      },
      lastMessage: conv.messages[0] ? {
        content: conv.messages[0].content,
        createdAt: conv.messages[0].createdAt,
        isFromFan: conv.messages[0].senderId !== id
      } : null,
      unreadCount: conv._count.messages,
      lastMessageAt: conv.lastMessageAt
    }))

    return NextResponse.json(formattedConversations)

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 