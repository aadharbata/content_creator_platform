import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
  console.log('🌱  Generating shared password hash...');

  // Pre-hash the testing password once so we can reuse for all users
  const sharedPasswordHash = await bcrypt.hash('testing', 10);

  console.log('🌱  Seeding creators...');

  // Better creator data with real names and avatars
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
    
    // Check if creator already exists
    const existingCreator = await prisma.user.findUnique({
      where: { email: `${creatorInfo.handle.toLowerCase().replace('@', '')}@example.com` }
    });

    if (!existingCreator) {
      const creator = await prisma.user.create({
        data: {
          email: `${creatorInfo.handle.toLowerCase().replace('@', '')}@example.com`,
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
    
    // Check if fan already exists
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
    // each fan subscribes to 2 random creators
    const chosen = faker.helpers.arrayElements(creators, 2);
    for (const creator of chosen) {
      subData.push({ userId: fan.id, creatorId: creator.id });
    }
  }
  
  // Insert subscriptions, skipping duplicates
  for (const sub of subData) {
    try {
      await prisma.subscription.create({
        data: sub
      });
    } catch (error) {
      // Skip if subscription already exists
      console.log(`  • Subscription already exists: ${sub.userId} -> ${sub.creatorId}`);
    }
  }

  // --------------------
  // Final logs
  // --------------------
  console.log('\n🌱  Seeded Creator Accounts (use password "testing")');
  creators.forEach((c) => console.log(`  • ${c.email}`));

  console.log('\n🌱  Seeded Fan Accounts (use password "testing")');
  fans.slice(0, 5).forEach((f) => console.log(`  • ${f.email}`));

  console.log('\n✅  Seed completed');
}

main().finally(() => prisma.$disconnect()); 