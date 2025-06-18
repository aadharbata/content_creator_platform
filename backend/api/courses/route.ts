import { NextResponse } from "next/server"
import { topCourses } from "@/frontend/data/courses"

export async function GET(request: Request) {
  // In a real application, this would fetch from a database
  return NextResponse.json({ courses: topCourses })
}
