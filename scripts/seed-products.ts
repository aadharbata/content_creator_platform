import prisma from '../lib/prisma';

const sampleProducts = [
  {
    title: "Premium Photo Pack - Nature Collection",
    description: "A curated collection of 50+ high-resolution nature photographs perfect for your creative projects. Includes landscapes, wildlife, and macro shots.",
    price: 29.99,
    type: "IMAGE",
    thumbnail: "/product-images/nature-collection.jpg",
    category: "Photography"
  },
  {
    title: "Complete Web Development Course",
    description: "Master modern web development with this comprehensive course covering HTML, CSS, JavaScript, React, and Node.js. 40+ hours of content.",
    price: 199.99,
    type: "COURSE",
    thumbnail: "/product-images/web-dev-course.jpg",
    category: "Education"
  },
  {
    title: "Meditation & Mindfulness Audio Series",
    description: "10 guided meditation sessions to reduce stress and improve focus. Each session is 15-30 minutes long with soothing background music.",
    price: 24.99,
    type: "AUDIO",
    thumbnail: "/product-images/meditation-audio.jpg",
    category: "Health & Wellness"
  },
  {
    title: "Social Media Templates Bundle",
    description: "200+ professionally designed templates for Instagram, Facebook, and Twitter. Includes posts, stories, and cover designs.",
    price: 39.99,
    type: "TEMPLATE",
    thumbnail: "/product-images/social-templates.jpg",
    category: "Design"
  },
  {
    title: "Fitness Workout Video Series",
    description: "12-week progressive fitness program with detailed workout videos. Suitable for all fitness levels with modifications provided.",
    price: 79.99,
    type: "VIDEO",
    thumbnail: "/product-images/fitness-videos.jpg",
    category: "Health & Wellness"
  },
  {
    title: "Digital Marketing eBook",
    description: "The complete guide to digital marketing strategies for small businesses. 250+ pages covering SEO, social media, and email marketing.",
    price: 19.99,
    type: "EBOOK",
    thumbnail: "/product-images/digital-marketing-ebook.jpg",
    category: "Business"
  },
  {
    title: "Photo Editing Software Plugin",
    description: "Professional photo editing plugin with advanced filters and effects. Compatible with Photoshop and Lightroom.",
    price: 49.99,
    type: "SOFTWARE",
    thumbnail: "/product-images/photo-plugin.jpg",
    category: "Photography"
  },
  {
    title: "Handmade Ceramic Mug Set",
    description: "Beautiful set of 4 handcrafted ceramic mugs with unique glazed finishes. Perfect for coffee lovers or as a gift.",
    price: 89.99,
    type: "PHYSICAL",
    thumbnail: "/product-images/ceramic-mugs.jpg",
    category: "Arts & Crafts"
  },
  {
    title: "Business Logo Design Package",
    description: "Professional logo design service with 3 concepts, unlimited revisions, and final files in multiple formats.",
    price: 299.99,
    type: "OTHER",
    thumbnail: "/product-images/logo-design.jpg",
    category: "Design"
  },
  {
    title: "Cooking Masterclass Video Collection",
    description: "Learn to cook like a professional chef with this comprehensive video collection. 25+ recipes with step-by-step instructions.",
    price: 149.99,
    type: "VIDEO",
    thumbnail: "/product-images/cooking-masterclass.jpg",
    category: "Food & Cooking"
  }
];

async function createProductImages() {
  console.log('📸 Creating product images...');
  
  // Create placeholder images for products
  const fs = require('fs');
  const path = require('path');
  
  const publicDir = path.join(process.cwd(), 'public');
  const productImagesDir = path.join(publicDir, 'product-images');
  
  // Create product-images directory if it doesn't exist
  if (!fs.existsSync(productImagesDir)) {
    fs.mkdirSync(productImagesDir, { recursive: true });
  }
  
  // Create placeholder images with product names
  const imageNames = [
    'nature-collection.jpg',
    'web-dev-course.jpg',
    'meditation-audio.jpg',
    'social-templates.jpg',
    'fitness-videos.jpg',
    'digital-marketing-ebook.jpg',
    'photo-plugin.jpg',
    'ceramic-mugs.jpg',
    'logo-design.jpg',
    'cooking-masterclass.jpg'
  ];
  
  for (const imageName of imageNames) {
    const imagePath = path.join(productImagesDir, imageName);
    if (!fs.existsSync(imagePath)) {
      // Create a simple placeholder text file (you can replace these with actual images later)
      fs.writeFileSync(imagePath, `Placeholder image for ${imageName}`);
    }
  }
  
  console.log('✅ Product images created successfully!');
}

async function main() {
  console.log('🛍️ Starting product seeding...');
  
  try {
    // Create product images
    await createProductImages();
    
    // Get all creators from the database
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
      console.log('❌ No creators found! Please create some creator users first.');
      return;
    }
    
    console.log(`📋 Found ${creators.length} creators`);
    
    // Create product categories
    const categoryNames = [
      'Photography',
      'Education', 
      'Health & Wellness',
      'Design',
      'Business',
      'Arts & Crafts',
      'Food & Cooking'
    ];
    
    console.log('🏷️ Creating product categories...');
    const categories = [];
    
    for (const categoryName of categoryNames) {
      const existingCategory = await prisma.productCategory.findUnique({
        where: { name: categoryName }
      });
      
      if (!existingCategory) {
        const category = await prisma.productCategory.create({
          data: {
            name: categoryName,
            description: `Products related to ${categoryName.toLowerCase()}`
          }
        });
        categories.push(category);
        console.log(`  • Created category: ${category.name}`);
      } else {
        categories.push(existingCategory);
        console.log(`  • Category already exists: ${existingCategory.name}`);
      }
    }
    
    // Create products
    console.log('🛍️ Creating products...');
    
    for (let i = 0; i < sampleProducts.length; i++) {
      const productData = sampleProducts[i];
      
      // Assign creator in round-robin fashion
      const assignedCreator = creators[i % creators.length];
      
      // Find the category
      const category = categories.find(cat => cat.name === productData.category);
      
      const product = await prisma.product.create({
        data: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          type: productData.type as any, // Cast to ProductType enum
          thumbnail: productData.thumbnail,
          status: 'PUBLISHED', // Set to PUBLISHED so it appears in API
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rating between 3.0-5.0
          salesCount: Math.floor(Math.random() * 50), // Random sales count 0-49
          creatorId: assignedCreator.id,
          categoryId: category?.id || null
        }
      });
      
      console.log(`  • Created product: "${product.title}" (assigned to ${assignedCreator.name})`);
    }
    
    console.log('✅ Product seeding completed successfully!');
    
    // Display summary
    const totalProducts = await prisma.product.count();
    const totalCategories = await prisma.productCategory.count();
    
    console.log(`📊 Summary:`);
    console.log(`  - Total products: ${totalProducts}`);
    console.log(`  - Total categories: ${totalCategories}`);
    console.log(`  - Total creators: ${creators.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 