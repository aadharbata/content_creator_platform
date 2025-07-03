import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
// For now, use a hardcoded user for development
const defaultUserId = 'test-user-id'

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  // Simulate authentication (replace with real auth in production)
  const user = { id: defaultUserId }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { content } = await req.json()
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Create new comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: user.id,
        postId: params.postId
      }
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
} 