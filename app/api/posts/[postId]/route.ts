import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { postId } = params

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        creator: true,
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if current user has liked this post
    let isLiked = false
    if (session?.user) {
      const userId = (session.user as any).id
      const userLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId
          }
        }
      })
      isLiked = !!userLike
    }

    // Calculate total likes from PostMedia
    const totalLikes = post.media.reduce((sum: number, media: any) => sum + (media.LikesCount || 0), 0)

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        creator: post.creator,
        likes: totalLikes,
        comments: post._count.comments,
        isLiked: isLiked,
        media: post.media
      }
    })

  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params
    const userId = (session.user as any).id
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Find the post and check if the user is the creator
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if the user is the creator of the post
    if (post.creator.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own posts' },
        { status: 403 }
      )
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: title,
        content: content,
      }
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Post updated successfully',
        post: updatedPost
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params
    const userId = (session.user as any).id

    console.log('Delete request - Post ID:', postId)
    console.log('Delete request - User ID:', userId)

    // Find the post and check if the user is the creator
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true }
    })

    console.log('Found post:', post ? {
      id: post.id,
      creatorId: post.creatorId,
      creator: post.creator ? { id: post.creator.id, userId: post.creator.userId } : null
    } : 'Post not found')

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if the user is the creator of the post
    // The post.creatorId should match the creator's userId, not the session userId
    if (post.creator.userId !== userId) {
      console.log('Authorization failed - Post creator userId:', post.creator.userId, 'Session userId:', userId)
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own posts' },
        { status: 403 }
      )
    }

    console.log('Authorization successful, deleting post...')

    // Delete related data first to avoid foreign key constraint violations
    await prisma.$transaction(async (tx) => {
      // Delete post media first
      await tx.postMedia.deleteMany({
        where: { postId: postId }
      })

      // Delete post likes
      await tx.like.deleteMany({
        where: { postId: postId }
      })

      // Delete post comments
      await tx.comment.deleteMany({
        where: { postId: postId }
      })

      // Delete post tips
      await tx.tip.deleteMany({
        where: { postId: postId }
      })

      // Finally delete the post
      await tx.post.delete({
        where: { id: postId }
      })
    })

    console.log('Post deleted successfully')

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 