import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    title: "Premium Photo Pack - Nature Collection",
    description: "A curated collection of 50+ high-resolution nature photographs perfect for your creative projects. Includes landscapes, wildlife, and macro shots.",
    price: 29.99,
    type: "IMAGE",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"]
  },
  {
    title: "Digital Marketing Masterclass",
    description: "Complete digital marketing course covering SEO, social media, email marketing, and paid advertising. 15+ hours of content with practical exercises.",
    price: 199.99,
    type: "COURSE",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"]
  },
  {
    title: "Fitness Workout Videos",
    description: "30-day fitness challenge with daily workout videos. Suitable for all fitness levels with modifications and progress tracking.",
    price: 49.99,
    type: "VIDEO",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"]
  },
  {
    title: "Logo Design Templates",
    description: "Professional logo design templates in various styles. Includes source files for easy customization and multiple formats.",
    price: 79.99,
    type: "TEMPLATE",
    thumbnail: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop"]
  },
  {
    title: "Meditation Audio Collection",
    description: "Guided meditation sessions for stress relief, sleep, and mindfulness. 20+ audio tracks with different durations and themes.",
    price: 39.99,
    type: "AUDIO",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"]
  },
  {
    title: "Social Media Templates",
    description: "Ready-to-use social media templates for Instagram, Facebook, and Twitter. Includes Canva templates and design elements.",
    price: 59.99,
    type: "TEMPLATE",
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop"]
  },
  {
    title: "Web Development Course",
    description: "Learn web development from scratch. Covers HTML, CSS, JavaScript, React, and Node.js with real-world projects.",
    price: 299.99,
    type: "COURSE",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop"]
  },
  {
    title: "Photo Editing Plugin",
    description: "Professional photo editing plugin with advanced filters and effects. Compatible with Photoshop and Lightroom.",
    price: 89.99,
    type: "SOFTWARE",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"]
  },
  {
    title: "Cooking Masterclass",
    description: "Learn to cook like a professional chef. 50+ recipes with step-by-step video instructions and cooking tips.",
    price: 149.99,
    type: "COURSE",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop"]
  },
  {
    title: "Ceramic Mugs Collection",
    description: "Handcrafted ceramic mugs with unique designs. Perfect for coffee lovers and home decoration.",
    price: 24.99,
    type: "PHYSICAL",
    thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"]
  },
  {
    title: "E-book: Creative Writing Guide",
    description: "Comprehensive guide to creative writing. Includes writing prompts, techniques, and publishing advice.",
    price: 19.99,
    type: "EBOOK",
    thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop"]
  },
  {
    title: "Custom Website Design Service",
    description: "Professional website design service with custom coding, responsive design, and SEO optimization. Includes 3 months of support.",
    price: 599.99,
    type: "OTHER",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"]
  },
  {
    title: "Productivity App Bundle",
    description: "Collection of productivity apps for time management, project tracking, and team collaboration.",
    price: 129.99,
    type: "SOFTWARE",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"]
  }
];

async function main() {
  console.log('🌱 Starting product seeding...');

  try {
    // Get all creators (users with CREATOR role)
    const creators = await prisma.user.findMany({
      where: {
        role: 'CREATOR'
      },
      select: {
        id: true,
        name: true
      }
    });

    if (creators.length === 0) {
      console.log('❌ No creators found. Creating a test creator first...');
      
      // Create a test creator if none exist
      const testCreator = await prisma.user.create({
        data: {
          name: 'Test Creator',
          email: 'creator@test.com',
          role: 'CREATOR'
        }
      });
      
      creators.push({
        id: testCreator.id,
        name: testCreator.name
      });
      
      console.log('✅ Created test creator:', testCreator.name);
    }

    console.log(`📝 Found ${creators.length} creators`);

    // Create products
    const createdProducts = [];
    for (let i = 0; i < sampleProducts.length; i++) {
      const productData = sampleProducts[i];
      const creator = creators[i % creators.length]; // Distribute products among creators

      const product = await prisma.product.create({
        data: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          type: productData.type,
          thumbnail: productData.thumbnail,
          images: productData.images,
          status: 'PUBLISHED',
          creatorId: creator.id
        }
      });

      createdProducts.push(product);
      console.log(`✅ Created product: "${product.title}" by ${creator.name}`);
    }

    console.log(`\n🎉 Successfully created ${createdProducts.length} products!`);

    // Create some sample purchases for testing "My Products"
    await createSamplePurchases(createdProducts, creators);

    // Create some sample reviews
    await createSampleReviews(createdProducts, creators);

    console.log('\n✨ Product seeding completed successfully!');
    console.log('🌐 You can now visit the product store at: http://localhost:3000/consumer-channel');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createSamplePurchases(products: any[], creators: any[]) {
  console.log('\n🛒 Creating sample purchases for My Store testing...');
  
  // Get some consumers (users with CONSUMER role)
  const consumers = await prisma.user.findMany({
    where: {
      role: 'CONSUMER'
    },
    select: {
      id: true,
      name: true
    }
  });

  if (consumers.length === 0) {
    console.log('⚠️ No consumers found. Skipping sample purchases.');
    return;
  }

  // Create purchases for first 5 products
  for (let i = 0; i < Math.min(5, products.length); i++) {
    const product = products[i];
    const consumer = consumers[i % consumers.length];
    
    await prisma.productSale.create({
      data: {
        productId: product.id,
        buyerId: consumer.id,
        amount: product.price,
        currency: 'INR',
        status: 'SUCCEEDED'
      }
    });
    
    await prisma.product.update({
      where: { id: product.id },
      data: {
        salesCount: {
          increment: 1
        }
      }
    });
    
    console.log(`  • Created purchase: ${consumer.name} bought "${product.title}"`);
  }
  
  console.log('✅ Sample purchases created successfully!');
}

async function createSampleReviews(products: any[], creators: any[]) {
  console.log('\n⭐ Creating sample reviews...');
  
  const reviewComments = [
    "Amazing quality! Highly recommend this product.",
    "Great value for money. Exactly what I was looking for.",
    "Excellent product, fast delivery. Will buy again!",
    "Very satisfied with this purchase. Great work!",
    "Outstanding quality and service. Love it!",
    "Perfect for my needs. Highly satisfied!",
    "Great product, exceeded my expectations.",
    "Wonderful experience. Definitely worth the price.",
    "Fantastic quality and great customer service.",
    "Excellent product, highly recommend!"
  ];
  
  // Get consumers for reviews
  const consumers = await prisma.user.findMany({
    where: {
      role: 'CONSUMER'
    },
    select: {
      id: true,
      name: true
    }
  });

  if (consumers.length === 0) {
    console.log('⚠️ No consumers found. Skipping sample reviews.');
    return;
  }

  for (let i = 0; i < Math.min(8, products.length); i++) {
    const product = products[i];
    const consumer = consumers[i % consumers.length];
    const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
    const comment = reviewComments[i % reviewComments.length];
    
    await prisma.productReview.create({
      data: {
        productId: product.id,
        userId: consumer.id,
        rating: rating,
        comment: comment
      }
    });
    
    console.log(`  • Created review: ${consumer.name} gave ${rating} stars to "${product.title}"`);
  }
  
  console.log('✅ Sample reviews created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  }); 