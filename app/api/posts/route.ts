import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
// For now, use a hardcoded user for development
const defaultUserId = 'test-user-id'

export async function POST(req: NextRequest) {
  // Simulate authentication (replace with real auth in production)
  const user = { id: defaultUserId }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, isPaidOnly } = await req.json()

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
  })

  if (!creatorProfile) return NextResponse.json({ error: 'No creator profile' }, { status: 404 })

  const post = await prisma.post.create({
    data: {
      title,
      content,
      isPaidOnly,
      creatorId: creatorProfile.id,
    },
  })

  return NextResponse.json({ post })
} 