import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addProductPurchase() {
  try {
    // Get the consumer user (Aadhar Batra)
    const consumer = await prisma.user.findFirst({
      where: {
        email: 'mbatrajpr635@gmail.com',
        role: 'CONSUMER'
      }
    });

    if (!consumer) {
      console.log('Consumer not found');
      return;
    }

    console.log('Found consumer:', consumer.name);

    // Get a product to purchase
    const product = await prisma.product.findFirst({
      where: {
        title: {
          contains: 'Premium Photo Pack'
        }
      },
      include: {
        creator: true
      }
    });

    if (!product) {
      console.log('Product not found');
      return;
    }

    console.log('Found product:', product.title);

    // Create a product purchase
    const purchase = await prisma.productSale.create({
      data: {
        productId: product.id,
        buyerId: consumer.id,
        amount: product.price,
        status: 'SUCCEEDED'
      }
    });

    console.log('Created purchase:', purchase.id);

    // Add a review for the product
    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        userId: consumer.id,
        rating: 4,
        comment: 'Great product! The photos are high quality and exactly what I was looking for. Highly recommend!'
      }
    });

    console.log('Created review:', review.id);

    console.log('✅ Successfully added product purchase and review for testing!');
    console.log(`Product: ${product.title}`);
    console.log(`Price: ₹${product.price}`);
    console.log(`Creator: ${product.creator.name}`);

  } catch (error) {
    console.error('Error adding product purchase:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addProductPurchase(); 