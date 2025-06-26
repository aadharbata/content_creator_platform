import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const courses = await prisma.course.findMany({});
        console.log("Courses fetched response: ", courses);
        return NextResponse.json({courses}, {status: 200});
    } catch (error) {
        console.log("Error in fetching all courses: ", error);
        return NextResponse.json({message: "Error in fetching all courses"}, {status: 500});
    }
}