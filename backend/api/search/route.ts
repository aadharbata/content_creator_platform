import { NextResponse } from "next/server"
import { topCourses } from "@/frontend/data/courses"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const category = searchParams.get("category")

  // In a real application, this would perform a database search
  let results = [...topCourses]

  if (query) {
    results = results.filter(
      (course) =>
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.category.toLowerCase().includes(query.toLowerCase()),
    )
  }

  if (category && category !== "all") {
    results = results.filter((course) => course.category.toLowerCase() === category.toLowerCase())
  }

  return NextResponse.json({ results })
}
