import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
// For now, use a hardcoded user for development
const defaultUserId = 'test-user-id'

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  // Simulate authentication (replace with real auth in production)
  const user = { id: defaultUserId }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Check if user already liked this post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: params.postId
        }
      }
    })

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 })
    }

    // Create new like
    const like = await prisma.like.create({
      data: {
        userId: user.id,
        postId: params.postId
      }
    })

    return NextResponse.json({ like })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }
} 