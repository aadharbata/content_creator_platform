import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  Clearing all application data...');
  await prisma.$transaction([
    // Delete product-related data first (child tables)
    prisma.productReview.deleteMany(),
    prisma.productSale.deleteMany(),
    prisma.product.deleteMany(),
    prisma.productCategory.deleteMany(),
    
    // Delete payment and subscription data
    prisma.payment.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.courseAccess.deleteMany(),
    
    // Delete messaging data
    prisma.message.deleteMany(),
    prisma.communityMessage.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.communityConversation.deleteMany(),
    prisma.communityMember.deleteMany(),
    prisma.community.deleteMany(),
    
    // Delete other data
    prisma.notification.deleteMany(),
    prisma.contentAnalytics.deleteMany(),
    prisma.contentDelivery.deleteMany(),
    prisma.oTPVerification.deleteMany(),
    prisma.content.deleteMany(),
    prisma.review.deleteMany(),
    prisma.course.deleteMany(),
    prisma.lesson.deleteMany(),
    
    // Delete user-related data last (parent tables)
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