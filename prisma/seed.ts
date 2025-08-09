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
    const community = await prisma.community.upsert({
      where: {
        creatorId_type: {
          creatorId: creator.id,
          type: 'SUBSCRIPTION_COMMUNITY'
        }
      },
      update: {},
      create: {
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

    await prisma.communityConversation.upsert({
      where: { communityId: community.id },
      update: {},
      create: { communityId: community.id },
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
        creatorId: creator.id
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

  // Create creator profiles for the creators
  console.log('🌱  Creating creator profiles...');
  const creatorProfiles = [];
  for (const creator of creators) {
    const existingProfile = await prisma.creatorProfile.findUnique({
      where: { userId: creator.id }
    });

    if (!existingProfile) {
      const creatorProfile = await prisma.creatorProfile.create({
        data: {
          userId: creator.id,
          subscriptionPrice: 999, // ₹999 per month
          IsLive: Math.random() > 0.5, // Randomly set some as live
        }
      });
      creatorProfiles.push(creatorProfile);
      console.log(`  • Created creator profile for: ${creator.name}`);
    } else {
      creatorProfiles.push(existingProfile);
    }
  }

  // Create sample posts for creators
  console.log('🌱  Creating sample posts...');
  const postData = [
    {
      title: 'My Latest Fashion Haul',
      content: 'Just got back from shopping and I\'m so excited to share these amazing finds with you! Check out these gorgeous pieces that are perfect for the season ✨ #fashion #style #haul',
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop',
      isPaidOnly: false
    },
    {
      title: 'Behind the Scenes',
      content: 'Here\'s what goes on behind the camera! The process of creating content is just as fun as the final result. Thanks for being part of this journey 📸',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
      isPaidOnly: true
    },
    {
      title: 'Morning Workout Routine',
      content: 'Starting the day with some energy! Here\'s my current morning workout routine that keeps me motivated and strong 💪 What\'s your favorite way to start the day?',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      isPaidOnly: false
    },
    {
      title: 'Exclusive Training Tips',
      content: 'For my subscribers only! Here are my top 5 training tips that have helped me build strength and endurance. These techniques took me years to perfect!',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
      isPaidOnly: true
    },
    {
      title: 'New Art Project Reveal',
      content: 'I\'ve been working on this piece for weeks and I\'m finally ready to share it! This digital art piece represents my journey as an artist 🎨',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      isPaidOnly: false
    },
    {
      title: 'Digital Art Tutorial',
      content: 'Step-by-step process of how I create my art! This exclusive tutorial shows my complete workflow from concept to finished piece. Perfect for aspiring digital artists!',
      image: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&h=600&fit=crop',
      isPaidOnly: true
    },
    {
      title: 'Latest Tech Review',
      content: 'Just unboxed the newest smartphone and I have thoughts! Here\'s my first impression and what I think about the camera quality 📱',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
      isPaidOnly: false
    },
    {
      title: 'Detailed Tech Analysis',
      content: 'Deep dive into the specs and performance! My subscribers get access to detailed benchmarks and real-world usage scenarios.',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop',
      isPaidOnly: true
    },
    {
      title: 'Travel Diary: Bali',
      content: 'What an incredible week in Bali! The culture, food, and scenery were absolutely breathtaking. Swipe through for some of my favorite moments 🌍',
      image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=600&fit=crop',
      isPaidOnly: false
    },
    {
      title: 'Hidden Gems of Bali',
      content: 'My exclusive travel guide! Here are the secret spots and local experiences that most tourists never discover. Complete with maps and insider tips!',
      image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop',
      isPaidOnly: true
    },
    {
      title: 'Weekend Vibes',
      content: 'Relaxing weekend ahead! Sometimes it\'s nice to just slow down and enjoy the simple things in life. How are you spending your weekend?',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      isPaidOnly: false
    },
    {
      title: 'Styling Tips',
      content: 'Quick styling session! Here are 3 ways to style the same outfit for different occasions. Fashion is all about creativity and confidence ✨',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
      isPaidOnly: false
    }
  ];

  for (let i = 0; i < postData.length; i++) {
    const postInfo = postData[i];
    const creator = creators[i % creators.length];
    
    // Find the creator profile
    const creatorProfile = creatorProfiles.find(cp => cp.userId === creator.id);
    
    if (creatorProfile) {
      const post = await prisma.post.create({
        data: {
          title: postInfo.title,
          content: postInfo.content,
          creatorId: creatorProfile.id,
          isPaidOnly: postInfo.isPaidOnly,
        }
      });

      // Add media if image exists
      if (postInfo.image) {
        await prisma.postMedia.create({
          data: {
            url: postInfo.image,
            type: 'photo',
            postId: post.id,
          }
        });
      }

      // Add some random likes
      const likesCount = Math.floor(Math.random() * 50) + 5;
      const randomFans = faker.helpers.arrayElements(fans, Math.min(likesCount, fans.length));
      for (const fan of randomFans) {
        await prisma.like.create({
          data: {
            postId: post.id,
            userId: fan.id,
          }
        });
      }

      // Add some random tips
      if (Math.random() > 0.7) {
        const tipAmount = Math.floor(Math.random() * 500) + 50;
        const randomFan = faker.helpers.arrayElement(fans);
        await prisma.tip.create({
          data: {
            postId: post.id,
            userId: randomFan.id,
            amount: tipAmount,
          }
        });
      }

      console.log(`  • Created post: "${postInfo.title}" by ${creator.name}`);
    }
  }

  console.log('\n🌱  Seeded Creator Accounts (use password "testing")');
  creators.forEach((c) => console.log(`  • ${c.email}`));

  console.log('\n🌱  Seeded Fan Accounts (use password "testing")');
  fans.slice(0, 5).forEach((f) => console.log(`  • ${f.email}`));

  console.log('\n✅  Seed completed');
}

main().finally(() => prisma.$disconnect());
