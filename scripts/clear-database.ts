import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  Clearing all application data...');
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.courseAccess.deleteMany(),
    prisma.message.deleteMany(),
    prisma.communityMessage.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.communityConversation.deleteMany(),
    prisma.communityMember.deleteMany(),
    prisma.community.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.contentAnalytics.deleteMany(),
    prisma.contentDelivery.deleteMany(),
    prisma.oTPVerification.deleteMany(),
    prisma.content.deleteMany(),
    prisma.review.deleteMany(),
    prisma.course.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.creatorProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.category.deleteMany(),
    prisma.tag.deleteMany(),
  ]);
  console.log('✅  Database cleared.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 