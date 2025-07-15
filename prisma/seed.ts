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

  console.log('🌱  Creating product categories...');
  const categories = [
    { name: 'Digital Art', description: 'Digital artwork and illustrations' },
    { name: 'Photography', description: 'High-quality photos and images' },
    { name: 'Video Content', description: 'Video tutorials and content' },
    { name: 'Templates', description: 'Design templates and resources' },
    { name: 'Courses', description: 'Educational courses and tutorials' },
    { name: 'Software', description: 'Software tools and applications' },
    { name: 'E-books', description: 'Digital books and guides' },
    { name: 'Audio', description: 'Audio content and music' },
    { name: 'Physical Products', description: 'Physical merchandise' },
  ];

  const productCategories = [];
  for (const category of categories) {
    const existingCategory = await prisma.productCategory.findUnique({
      where: { name: category.name }
    });

    if (!existingCategory) {
      const newCategory = await prisma.productCategory.create({
        data: category
      });
      productCategories.push(newCategory);
      console.log(`  • Created category: ${category.name}`);
    } else {
      productCategories.push(existingCategory);
    }
  }

  console.log('🌱  Creating sample products...');
  const productData = [
    {
      title: 'Neon Abstract Patterns',
      description: 'A collection of vibrant neon abstract patterns perfect for digital art projects',
      price: 299,
      type: 'IMAGE',
      thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      salesCount: 847,
      categoryName: 'Digital Art'
    },
    {
      title: 'City Skyline 4K',
      description: 'High-resolution city skyline photography in 4K quality',
      price: 149,
      type: 'VIDEO',
      thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=300&fit=crop',
      rating: 4.8,
      salesCount: 623,
      categoryName: 'Photography'
    },
    {
      title: 'UI Design Kit',
      description: 'Complete UI design kit with components and templates',
      price: 79,
      type: 'TEMPLATE',
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      salesCount: 756,
      categoryName: 'Templates'
    },
    {
      title: 'Motion Graphics Course',
      description: 'Learn motion graphics from beginner to advanced level',
      price: 299,
      type: 'COURSE',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
      rating: 4.9,
      salesCount: 1234,
      categoryName: 'Courses'
    },
    {
      title: 'Minimalist Icons',
      description: 'Clean and modern minimalist icon set',
      price: 49,
      type: 'TEMPLATE',
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop',
      rating: 4.4,
      salesCount: 223,
      categoryName: 'Templates'
    },
    {
      title: 'Creative T-Shirt Design',
      description: 'Unique t-shirt design with creative artwork',
      price: 499,
      type: 'PHYSICAL',
      thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      rating: 4.6,
      salesCount: 312,
      categoryName: 'Physical Products'
    },
    {
      title: 'Web Development Course',
      description: 'Complete web development course with modern technologies',
      price: 599,
      type: 'COURSE',
      thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=300&fit=crop',
      rating: 4.7,
      salesCount: 892,
      categoryName: 'Courses'
    },
    {
      title: 'Productivity App',
      description: 'Advanced productivity application for professionals',
      price: 199,
      type: 'SOFTWARE',
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=300&fit=crop',
      rating: 4.5,
      salesCount: 445,
      categoryName: 'Software'
    }
  ];

  for (const productInfo of productData) {
    const category = productCategories.find(c => c.name === productInfo.categoryName);
    const creator = faker.helpers.arrayElement(creators);

    const product = await prisma.product.create({
      data: {
        title: productInfo.title,
        description: productInfo.description,
        price: productInfo.price,
        type: productInfo.type as any,
        thumbnail: productInfo.thumbnail,
        rating: productInfo.rating,
        salesCount: productInfo.salesCount,
        status: 'PUBLISHED',
        creatorId: creator.id,
        categoryId: category?.id
      }
    });

    console.log(`  • Created product: ${product.title} by ${creator.name}`);
  }

  // Create some product sales for testing "My Products"
  console.log('🌱  Creating product sales for testing...');
  const productSales = [];
  for (let i = 0; i < 5; i++) {
    const product = await prisma.product.findFirst({
      skip: i,
      orderBy: { createdAt: 'desc' }
    });
    const buyer = fans[i % fans.length];
    
    if (product && buyer) {
      const sale = await prisma.productSale.create({
        data: {
          productId: product.id,
          buyerId: buyer.id,
          amount: product.price,
          currency: 'INR',
          status: 'SUCCEEDED'
        }
      });
      productSales.push(sale);
      console.log(`  • Created sale: ${buyer.name} purchased ${product.title}`);
    }
  }

  console.log('\n🌱  Seeded Creator Accounts (use password "testing")');
  creators.forEach((c) => console.log(`  • ${c.email}`));

  console.log('\n🌱  Seeded Fan Accounts (use password "testing")');
  fans.slice(0, 5).forEach((f) => console.log(`  • ${f.email}`));

  console.log('\n✅  Seed completed');
}

main().finally(() => prisma.$disconnect());
