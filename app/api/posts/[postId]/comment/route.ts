import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any).id;
  let content: string | undefined = undefined;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {}
  content = body.content as string;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
  }
  try {
    // Create new comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        postId
      },
      include: {
        user: {
          select: { name: true, profile: { select: { avatarUrl: true } } }
        }
      }
    });
    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

// export async function POST(req: NextRequest, {params}: {params:Promise<{postId: string}>}){
//   try {
//     const {postId} = await params;
//     const authHeader = req.h
//   } catch (error) {
//     console.log("Error in post route of comment: ", error);
//     return NextResponse.json({message: "Errror in post route of comment"}, {status: 500});
//   }
// }

export async function GET(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { name: true, profile: { select: { avatarUrl: true } } }
        }
      }
    })
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any).id;
  let commentId: string | undefined = undefined;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {}
  commentId = body.commentId as string;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
  
  try {
    // Get the comment and post details
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId },
      include: {
        post: {
          include: {
            creator: true
          }
        }
      }
    });
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user is the comment author OR the post creator
    const isCommentAuthor = comment.userId === userId;
    const isPostCreator = comment.post.creator.userId === userId;
    
    if (!isCommentAuthor && !isPostCreator) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
} 