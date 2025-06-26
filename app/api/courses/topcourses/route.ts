import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const topCourses = await prisma.course.findMany({
      // include: {
      //   author: {
      //     select: {
      //       name: true
      //     }
      //   }
      // },
      orderBy: {
        salesCount: 'desc'
      },
      take: 4
    });
    console.log("Topcourses: ", topCourses);
    
    // Transform data to match frontend interface
    // const topCourses = courses.map((course: any) => ({
    //   id: course.id,
    //   title: course.title,
    //   author: course.author.name,
    //   price: course.price,
    //   rating: course.rating,
    //   students: course.salesCount, // Map salesCount to students
    //   imgUrl: course.imgURL,
    //   category: "Development" // Default category for now
    // }));
    
    return NextResponse.json({courses: topCourses}, {status: 200});
  } catch (error) {
    console.log("Error in fetching top courses: ", error);
    return NextResponse.json({message: "Error in fetching top courses"}, {status: 500});
  }
}