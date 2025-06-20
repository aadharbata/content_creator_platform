// import prisma from "@/lib/prisma";

import prisma from "@/backend2/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
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