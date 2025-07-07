import { PrismaClient } from '../lib/generated/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Generating shared password hash...');

  // Pre-hash the testing password once so we can reuse for all users
  const sharedPasswordHash = await bcrypt.hash('testing', 10);

  console.log('🌱  Seeding creators...');

  const creators = [];
  for (let i = 0; i < 5; i++) {
    const creator = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        name: `Creator ${i + 1}`,
        passwordHash: sharedPasswordHash,
        role: 'CREATOR',
        profile: {
          create: {
            bio: faker.person.bio(),
            avatarUrl: faker.image.avatar(),
          },
        },
      },
    });
    creators.push(creator);
  }

  console.log('🌱  Creating fans...');
  const fans = [];
  for (let i = 0; i < 20; i++) {
    const fan = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        name: `Fan ${i + 1}`,
        passwordHash: sharedPasswordHash,
        role: 'CONSUMER',
      },
    });
    fans.push(fan);
  }

  console.log('🌱  Creating subscriptions...');
  const subData = [];
  for (const fan of fans) {
    // each fan subscribes to 2 random creators
    const chosen = faker.helpers.arrayElements(creators, 2);
    for (const creator of chosen) {
      subData.push({ userId: fan.id, creatorId: creator.id });
    }
  }
  await prisma.subscription.createMany({ data: subData, skipDuplicates: true });

  // --------------------
  // Create subscription communities for each creator
  // --------------------
  console.log('\n🌱  Creating subscription communities...');

  for (const creator of creators) {
    // 1. Create community owned by creator
    const community = await prisma.community.create({
      data: {
        name: `${creator.name}'s Community`,
        description: `Community for fans of ${creator.name}`,
        type: 'SUBSCRIPTION_COMMUNITY',
        creatorId: creator.id,
      },
    });

    // 2. Gather members (fans who subscribed to this creator) + the creator themselves
    const memberData = subData
      .filter((sub) => sub.creatorId === creator.id)
      .map((sub) => ({
        communityId: community.id,
        userId: sub.userId,
      }));

    // Ensure creator is also a member
    memberData.push({ communityId: community.id, userId: creator.id });

    // 3. Insert members, skipping duplicates
    await prisma.communityMember.createMany({
      data: memberData,
      skipDuplicates: true,
    });

    // 4. Create associated conversation for the community
    await prisma.communityConversation.create({
      data: { communityId: community.id },
    });

    console.log(`  • Created community for ${creator.name} with ${memberData.length} members`);
  }

  // --------------------
  // Final logs
  // --------------------
  console.log('\n🌱  Seeded Creator Accounts (use password "testing")');
  creators.forEach((c) => console.log(`  • ${c.email}`));

  console.log('\n🌱  Seeded Fan Accounts (use password "testing")');
  fans.forEach((f) => console.log(`  • ${f.email}`));

  console.log('\n✅  Seed completed');
}

main().finally(() => prisma.$disconnect()); 