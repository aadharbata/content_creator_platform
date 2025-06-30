import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatarUrl: true
              }
            }
          }
        },
        contents: {
          include: {
            Category: {
              select: {
                name: true
              }
            }
          },
          take: 1
        },
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: {
        salesCount: 'desc'
      },
      take: 4
    });
    
    // Transform data to match Course interface for both landing and home pages
    const topCourses = courses.map((course: any) => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / course.reviews.length
        : course.rating

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: course._count.reviews,
        salesCount: course.salesCount,
        duration: course.duration,
        imgURL: course.imgURL,
        category: course.contents.length > 0 && course.contents[0].Category 
          ? course.contents[0].Category.name 
          : 'General',
        author: {
          id: course.author.id,
          name: course.author.name,
          avatarUrl: course.author.profile?.avatarUrl || '/placeholder.svg'
        },
        badge: course.salesCount > 100 ? 'Bestseller' : 
               course.salesCount > 50 ? 'Popular' : 
               course._count.reviews > 20 ? 'Top Rated' : null,
        isFeatured: true
      }
    });
    
    return NextResponse.json({courses: topCourses}, {status: 200});
  } catch (error) {
    console.log("Error in fetching top courses: ", error);
    return NextResponse.json({message: "Error in fetching top courses"}, {status: 500});
  }
}