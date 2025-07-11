import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const jwtSecret = process.env.JWT_SECRET || 'Ishan';
  let userId: string | null = null;
  let content: string | undefined = undefined;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {}
  // Only allow JWT
  if (token) {
    try {
      const jwtUser = jwt.verify(token, jwtSecret) as { userId: string; role?: string };
      userId = jwtUser.userId;
    } catch (error) {
      console.error('Error in jwtuser verify:', error);
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ error: 'JWT expired' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Invalid JWT' }, { status: 401 });
    }
  }
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

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const jwtSecret = process.env.JWT_SECRET || 'Ishan';
  let userId: string | null = null;
  let commentId: string | undefined = undefined;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {}
  // Only allow JWT
  if (token) {
    try {
      const jwtUser = jwt.verify(token, jwtSecret) as { userId: string; role?: string };
      userId = jwtUser.userId;
    } catch (error) {
      console.error('Error in jwtuser verify:', error);
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ error: 'JWT expired' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Invalid JWT' }, { status: 401 });
    }
  }
  commentId = body.commentId as string;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
  try {
    // Only allow deleting own comment
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.userId !== userId) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
} 