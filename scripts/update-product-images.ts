import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const productImageUpdates = [
  {
    title: "Digital Marketing Masterclass",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1557838923-2985c318be48?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "Web Development Bootcamp",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "UI/UX Design Fundamentals",
    thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "Business Strategy E-Book",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "Social Media Templates Pack",
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "Fitness Training Videos",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "Logo Design Package",
    thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "Meditation Audio Collection",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "Photography Editing Plugin",
    thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&crop=center"
    ]
  },
  {
    title: "Cooking Masterclass Series",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center",
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center"
    ]
  }
];

async function updateProductImages() {
  try {
    console.log('🖼️ Starting product image updates...');

    for (const update of productImageUpdates) {
      const product = await prisma.product.findFirst({
        where: {
          title: update.title
        }
      });

      if (product) {
        await prisma.product.update({
          where: {
            id: product.id
          },
          data: {
            thumbnail: update.thumbnail,
            images: update.images
          }
        });

        console.log(`✅ Updated images for: ${update.title}`);
      } else {
        console.log(`❌ Product not found: ${update.title}`);
      }
    }

    console.log('🎉 Product image updates completed successfully!');

  } catch (error) {
    console.error('❌ Error updating product images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateProductImages(); 