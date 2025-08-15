import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixImages() {
  try {
    console.log('🔍 Checking product images...');

    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        thumbnail: true,
        images: true
      }
    });

    console.log('\n📊 Current products:');
    products.forEach(product => {
      console.log(`\n${product.title}:`);
      console.log(`  Thumbnail: ${product.thumbnail || 'MISSING'}`);
      console.log(`  Images: ${product.images?.length || 0} images`);
    });

    // Fix missing images
    const imageFixes = [
      {
        title: "Cooking Masterclass Series",
        thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center",
        images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center"]
      },
      {
        title: "Photography Editing Plugin",
        thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&crop=center",
        images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&crop=center"]
      },
      {
        title: "Meditation Audio Collection",
        thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center",
        images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center"]
      },
      {
        title: "Logo Design Package",
        thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center",
        images: ["https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center"]
      },
      {
        title: "Fitness Training Videos",
        thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center"]
      },
      {
        title: "Social Media Templates Pack",
        thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop&crop=center",
        images: ["https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop&crop=center"]
      }
    ];

    console.log('\n🔧 Fixing product images...');

    for (const fix of imageFixes) {
      const product = await prisma.product.findFirst({
        where: { title: fix.title }
      });

      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            thumbnail: fix.thumbnail,
            images: fix.images
          }
        });
        console.log(`✅ Fixed: ${fix.title}`);
      }
    }

    console.log('\n🎉 Image fixes completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixImages(); 