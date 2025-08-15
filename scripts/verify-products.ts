import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyProducts() {
  try {
    console.log('🔍 Verifying products...');

    const products = await prisma.product.findMany({
      where: { 
        creatorId: '3ec76a50-e2c6-4956-ba78-2cb960da03ec' 
      },
      select: { 
        title: true, 
        thumbnail: true,
        images: true
      }
    });

    console.log(`\n📊 Found ${products.length} products:`);
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   Thumbnail: ${product.thumbnail}`);
      console.log(`   Images: ${product.images?.length || 0} images`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProducts(); 