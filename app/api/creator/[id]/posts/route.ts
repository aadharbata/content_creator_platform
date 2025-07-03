import prisma from '@/lib/prisma'
// For now, use a hardcoded user for development
const defaultUserId = 'test-user-id'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Simulate authentication (replace with real auth in production)
  const user = { id: defaultUserId }

  const creator = await prisma.creatorProfile.findUnique({
    where: { id: params.id },
    include: {
      subscribers: true,
    },
  })

  const isSubscribed = creator?.subscribers.some(sub => sub.userId === user?.id)

  const posts = await prisma.post.findMany({
    where: {
      creatorId: params.id,
      isPaidOnly: isSubscribed ? undefined : false,
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ posts, isSubscribed })
} 