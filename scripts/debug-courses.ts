import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCourses() {
  try {
    console.log('🔍 Debugging courses API...');

    const creatorId = '3ec76a50-e2c6-4956-ba78-2cb960da03ec';

    // Fetch both courses and products
    const [courses, products] = await Promise.all([
      prisma.course.findMany({
        where: {
          authorId: creatorId
        },
        select: {
          id: true,
          title: true,
          imgURL: true
        }
      }),
      prisma.product.findMany({
        where: {
          creatorId: creatorId,
          status: "PUBLISHED"
        },
        select: {
          id: true,
          title: true,
          thumbnail: true
        }
      })
    ]);

    console.log('\n📚 Actual Courses:');
    courses.forEach(course => {
      console.log(`  ${course.title}: ${course.imgURL || 'NO IMAGE'}`);
    });

    console.log('\n🛍️ Products (will be converted to courses):');
    products.forEach(product => {
      console.log(`  ${product.title}: ${product.thumbnail || 'NO IMAGE'}`);
    });

    // Simulate the transformation
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      imgURL: product.thumbnail
    }));

    console.log('\n🎯 Final Course List (after transformation):');
    const allCourses = [...courses, ...transformedProducts];
    allCourses.forEach(course => {
      console.log(`  ${course.title}: ${course.imgURL || 'NO IMAGE'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCourses(); 