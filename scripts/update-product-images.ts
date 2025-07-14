import prisma from '../lib/prisma';

const imageUpdates = [
  { old: '/product-images/nature-collection.jpg', new: '/product-images/nature-collection.svg' },
  { old: '/product-images/web-dev-course.jpg', new: '/product-images/web-dev-course.svg' },
  { old: '/product-images/meditation-audio.jpg', new: '/product-images/meditation-audio.svg' },
  { old: '/product-images/social-templates.jpg', new: '/product-images/social-templates.svg' },
  { old: '/product-images/fitness-videos.jpg', new: '/product-images/fitness-videos.svg' },
  { old: '/product-images/digital-marketing-ebook.jpg', new: '/product-images/digital-marketing-ebook.svg' },
  { old: '/product-images/photo-plugin.jpg', new: '/product-images/photo-plugin.svg' },
  { old: '/product-images/ceramic-mugs.jpg', new: '/product-images/ceramic-mugs.svg' },
  { old: '/product-images/logo-design.jpg', new: '/product-images/logo-design.svg' },
  { old: '/product-images/cooking-masterclass.jpg', new: '/product-images/cooking-masterclass.svg' }
];

async function main() {
  console.log('🔄 Updating product image paths...');
  
  try {
    for (const update of imageUpdates) {
      const result = await prisma.product.updateMany({
        where: {
          thumbnail: update.old
        },
        data: {
          thumbnail: update.new
        }
      });
      
      if (result.count > 0) {
        console.log(`  • Updated ${result.count} products: ${update.old} → ${update.new}`);
      }
    }
    
    console.log('✅ Product image paths updated successfully!');
    
    // Display updated products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        thumbnail: true,
        status: true
      }
    });
    
    console.log('\n📊 Current products:');
    products.forEach(product => {
      console.log(`  • ${product.title} (${product.status})`);
      console.log(`    Image: ${product.thumbnail}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating product images:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 