import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
  console.log('🌱  Generating shared password hash...');

  // Pre-hash the testing password once so we can reuse for all users
  const sharedPasswordHash = await bcrypt.hash('testing', 10);

  console.log('🌱  Seeding creators...');

  const creatorData = [
    {
      name: 'Sophia Rivera',
      handle: '@SophiaRivera',
      bio: 'Fashion & lifestyle content creator. Sharing my journey through style and self-discovery ✨',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      name: 'Marcus Chen',
      handle: '@MarcusChen',
      bio: 'Fitness enthusiast and nutritionist. Building better lives one workout at a time 💪',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      name: 'Luna Williams',
      handle: '@LunaWilliams',
      bio: 'Digital artist and creative soul. Bringing imagination to life through art 🎨',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
    },
    {
      name: 'Alex Thompson',
      handle: '@AlexThompson',
      bio: 'Tech reviewer and gadget lover. Reviewing the latest tech so you don\'t have to 📱',
      avatar: 'https://randomuser.me/api/portraits/men/76.jpg'
    },
    {
      name: 'Maya Patel',
      handle: '@MayaPatel',
      bio: 'Travel blogger and adventure seeker. Exploring the world one destination at a time 🌍',
      avatar: 'https://randomuser.me/api/portraits/women/22.jpg'
    }
  ];

  const creators = [];

  for (let i = 0; i < creatorData.length; i++) {
    const creatorInfo = creatorData[i];

    const email = `${creatorInfo.handle.toLowerCase().replace('@', '')}@example.com`;

    const existingCreator = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingCreator) {
      const creator = await prisma.user.create({
        data: {
          email,
          name: creatorInfo.name,
          passwordHash: sharedPasswordHash,
          role: 'CREATOR',
          profile: {
            create: {
              bio: creatorInfo.bio,
              avatarUrl: creatorInfo.avatar,
              website: `https://${creatorInfo.handle.toLowerCase().replace('@', '')}.com`,
              instagram: creatorInfo.handle.replace('@', ''),
              twitter: creatorInfo.handle.replace('@', ''),
            },
          },
        },
      });
      creators.push(creator);
      console.log(`  • Created creator: ${creator.name}`);
    } else {
      creators.push(existingCreator);
      console.log(`  • Creator already exists: ${existingCreator.name}`);
    }
  }

  console.log('🌱  Creating fans...');
  const fans = [];

  for (let i = 0; i < 20; i++) {
    const email = faker.internet.email().toLowerCase();

    const existingFan = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingFan) {
      const fan = await prisma.user.create({
        data: {
          email,
          name: `Fan ${i + 1}`,
          passwordHash: sharedPasswordHash,
          role: 'CONSUMER',
        },
      });
      fans.push(fan);
    } else {
      fans.push(existingFan);
    }
  }

  console.log('🌱  Creating subscriptions...');
  const subData = [];
  for (const fan of fans) {
    const chosen = faker.helpers.arrayElements(creators, 2);
    for (const creator of chosen) {
      subData.push({ userId: fan.id, creatorId: creator.id });
    }
  }

  await prisma.subscription.createMany({ data: subData, skipDuplicates: true });

  console.log('\n🌱  Creating subscription communities...');
  for (const creator of creators) {
    const community = await prisma.community.create({
      data: {
        name: `${creator.name}'s Community`,
        description: `Community for fans of ${creator.name}`,
        type: 'SUBSCRIPTION_COMMUNITY',
        creatorId: creator.id,
      },
    });

    const memberData = subData
      .filter((sub) => sub.creatorId === creator.id)
      .map((sub) => ({
        communityId: community.id,
        userId: sub.userId,
      }));

    memberData.push({ communityId: community.id, userId: creator.id });

    await prisma.communityMember.createMany({
      data: memberData,
      skipDuplicates: true,
    });

    await prisma.communityConversation.create({
      data: { communityId: community.id },
    });

    console.log(`  • Created community for ${creator.name} with ${memberData.length} members`);
  }

  console.log('\n🌱  Seeded Creator Accounts (use password "testing")');
  creators.forEach((c) => console.log(`  • ${c.email}`));

  console.log('\n🌱  Seeded Fan Accounts (use password "testing")');
  fans.slice(0, 5).forEach((f) => console.log(`  • ${f.email}`));

  console.log('\n✅  Seed completed');
}

main().finally(() => prisma.$disconnect());
