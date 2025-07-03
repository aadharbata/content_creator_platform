import prisma from '@/lib/prisma'
// For now, use a hardcoded user for development
const defaultUserId = 'test-user-id'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Simulate authentication (replace with real auth in production)
  const user = { id: defaultUserId }

  const creator = await prisma.creatorProfile.findUnique({
    where: { id: id },
    include: {
      subscribers: true,
    },
  })

  const isSubscribed = creator?.subscribers.some(sub => sub.userId === user?.id)

  const posts = await prisma.post.findMany({
    where: {
      creatorId: id,
      isPaidOnly: isSubscribed ? undefined : false,
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ posts, isSubscribed })
} 