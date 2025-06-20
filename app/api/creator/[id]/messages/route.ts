import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    // Get query parameters for filtering
    const type = searchParams.get('type') // question, feedback, support, general, unread
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      receiverId: id
    }

    // Filter by type
    if (type && type !== 'all') {
      if (type === 'unread') {
        where.isRead = false
      } else {
        where.type = type.toUpperCase()
      }
    }

    // Search functionality
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { sender: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Fetch messages with efficient joins
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: [
          { isRead: 'asc' }, // Unread messages first
          { createdAt: 'desc' } // Then by newest
        ],
        skip: offset,
        take: limit
      }),
      prisma.message.count({ where })
    ])

    // Get unread count for the creator
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: id,
        isRead: false
      }
    })

    // Transform messages to match frontend interface
    const transformedMessages = messages.map((message: any) => ({
      id: message.id,
      fanId: message.sender.id,
      fanName: message.sender.name,
      fanAvatar: message.sender.profile?.avatarUrl || '/placeholder.svg?height=40&width=40',
      subject: message.subject,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
      isRead: message.isRead,
      type: message.type.toLowerCase(),
      courseName: message.course?.title || null
    }))

    return NextResponse.json({
      messages: transformedMessages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      unreadCount
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { messageId, action } = body

    if (action === 'markAsRead') {
      await prisma.message.update({
        where: {
          id: messageId,
          receiverId: id // Ensure the creator owns this message
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'markAllAsRead') {
      await prisma.message.updateMany({
        where: {
          receiverId: id,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
} 