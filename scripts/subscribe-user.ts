import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

const FAN_ID = '91ae3c2e-9350-4d89-9a39-733bcc7badfb';
const CREATOR_ID = '56533c3c-d6eb-4ce2-976e-39cdfc8e4b26';

async function main() {
  try {
    const existing = await prisma.subscription.findUnique({
      where: { userId_creatorId: { userId: FAN_ID, creatorId: CREATOR_ID } },
    });

    if (existing) {
      console.log('Subscription already exists');
      return;
    }

    await prisma.subscription.create({
      data: {
        userId: FAN_ID,
        creatorId: CREATOR_ID,
      },
    });

    console.log('Subscription created successfully');
  } catch (error) {
    console.error('Error creating subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 