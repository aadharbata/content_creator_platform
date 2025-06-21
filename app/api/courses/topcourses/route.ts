import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"
// import { topCourses } from "@/frontend/data/courses"

export async function GET(req: NextRequest) {
  // In a real application, this would fetch from a database
  try {
    const topCourses = await prisma.course.findMany({
      orderBy: {
        salesCount: 'desc'
      },
      take: 5
    });
    console.log("Fetching top courses: ", topCourses);
    return NextResponse.json({courses: topCourses}, {status: 200});
  } catch (error) {
    console.log("Error in fetching top courses: ", error);
    return NextResponse.json({message: "Error in fetching top courses"}, {status: 500});
  }
}