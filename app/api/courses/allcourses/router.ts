import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log("Request reach to backend api endpoint");
        const courses = await prisma.course.findMany({});
        console.log("Courses fetched response: ", courses);
        return NextResponse.json({courses}, {status: 200});
    } catch (error) {
        console.log("Erorr in fetching courses: ", error);
        return NextResponse.json({message: "Error in fetching courses"}, {status: 500});
    }
}

// import prisma from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     const topCourses = await prisma.course.findMany({
//       orderBy: {
//         salesCount: 'desc'
//       },
//       take: 4
//     });
//     console.log("Topcourses: ", topCourses);
    
//     return NextResponse.json({courses: topCourses}, {status: 200});
//   } catch (error) {
//     console.log("Error in fetching top courses: ", error);
//     return NextResponse.json({message: "Error in fetching top courses"}, {status: 500});
//   }
// }