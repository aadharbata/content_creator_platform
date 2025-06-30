import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        author: {
          select: {
            name: true
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
        }
      },
      orderBy: {
        salesCount: 'desc'
      },
      take: 4
    });
    
    // Transform data to match frontend interface
    const topCourses = courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      author: course.author.name,
      price: course.price,
      rating: course.rating,
      students: course.salesCount, // Map salesCount to students
      imgUrl: course.imgURL,      // Map imgURL to imgUrl
      category: course.contents.length > 0 && course.contents[0].Category 
        ? course.contents[0].Category.name 
        : 'General'
    }));
    
    return NextResponse.json({courses: topCourses}, {status: 200});
  } catch (error) {
    console.log("Error in fetching top courses: ", error);
    return NextResponse.json({message: "Error in fetching top courses"}, {status: 500});
  }
}