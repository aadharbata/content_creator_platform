// @ts-nocheck
// This script seeds additional purchased products for development/testing
// Run with: npx tsx scripts/seed-products.ts --email you@example.com
import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    title: "Digital Marketing Masterclass",
    description: "Complete guide to digital marketing strategies, SEO, social media marketing, and content creation. Learn from industry experts and boost your online presence.",
    price: 2999,
    type: ProductType.COURSE,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1557838923-2985c318be48?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.8,
    salesCount: 156
  },
  {
    title: "Web Development Bootcamp",
    description: "Master modern web development with HTML, CSS, JavaScript, React, and Node.js. Build real-world projects and launch your career in tech.",
    price: 4999,
    type: ProductType.COURSE,
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.9,
    salesCount: 234
  },
  {
    title: "UI/UX Design Fundamentals",
    description: "Learn the principles of user interface and user experience design. Create beautiful, functional designs that users love.",
    price: 3499,
    type: ProductType.COURSE,
    thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.7,
    salesCount: 89
  },
  {
    title: "Business Strategy E-Book",
    description: "Comprehensive guide to building and scaling successful businesses. Includes case studies, frameworks, and actionable strategies.",
    price: 999,
    type: ProductType.EBOOK,
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.6,
    salesCount: 312
  },
  {
    title: "Social Media Templates Pack",
    description: "Professional social media templates for Instagram, Facebook, and LinkedIn. Ready-to-use designs for posts, stories, and ads.",
    price: 1499,
    type: ProductType.TEMPLATE,
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.5,
    salesCount: 178
  },
  {
    title: "Fitness Training Videos",
    description: "Complete home workout program with 50+ video sessions. Suitable for all fitness levels with nutrition guidance included.",
    price: 1999,
    type: ProductType.VIDEO,
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.8,
    salesCount: 445
  },
  {
    title: "Logo Design Package",
    description: "Professional logo design service with unlimited revisions. Includes brand guidelines and multiple file formats.",
    price: 3999,
    type: ProductType.OTHER,
    thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.9,
    salesCount: 67
  },
  {
    title: "Meditation Audio Collection",
    description: "50 guided meditation sessions for stress relief, sleep, and mindfulness. Perfect for beginners and advanced practitioners.",
    price: 799,
    type: ProductType.AUDIO,
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.7,
    salesCount: 223
  },
  {
    title: "Photography Editing Plugin",
    description: "Advanced photo editing plugin for Lightroom and Photoshop. Includes presets, filters, and editing tools.",
    price: 2499,
    type: ProductType.SOFTWARE,
    thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.6,
    salesCount: 134
  },
  {
    title: "Cooking Masterclass Series",
    description: "Learn to cook like a professional chef with 30 video lessons. Includes recipes, techniques, and kitchen tips.",
    price: 2799,
    type: ProductType.COURSE,
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center"
    ],
    status: "PUBLISHED",
    rating: 4.8,
    salesCount: 189
  }
];

async function seedProducts() {
  try {
    console.log('🌱 Starting product seeding...');

    // Get the first creator from the database
    const creator = await prisma.user.findFirst({
      where: {
        role: 'CREATOR'
      }
    });

    if (!creator) {
      console.error('❌ No creator found in the database. Please create a creator first.');
      return;
    }

    console.log(`👤 Using creator: ${creator.name} (${creator.id})`);

    // Create products
    for (const productData of products) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          creatorId: creator.id
        }
      });

      console.log(`✅ Created product: ${product.title} (${product.id})`);
    }

    console.log('🎉 Product seeding completed successfully!');
    console.log(`📊 Created ${products.length} products`);

  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedProducts(); 