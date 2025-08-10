import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndUpdateProductImage() {
  try {
    // Get the product
    const product = await prisma.product.findFirst({
      where: {
        title: {
          contains: 'Premium Photo Pack'
        }
      }
    });

    if (!product) {
      console.log('Product not found');
      return;
    }

    console.log('Current product data:');
    console.log('Title:', product.title);
    console.log('Thumbnail:', product.thumbnail);

    // Update the thumbnail to a better image URL
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center'
      }
    });

    console.log('Updated product thumbnail to:', updatedProduct.thumbnail);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateProductImage(); 