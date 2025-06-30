import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get total courses count
    const totalCourses = await prisma.course.count({
      where: {
        authorId: id
      }
    })

    // Get total students (sum of all sales counts) - no price data needed
    const coursesWithSales = await prisma.course.findMany({
      where: {
        authorId: id
      },
      select: {
        salesCount: true
      }
    })

    const totalStudents = coursesWithSales.reduce((sum, course) => {
      return sum + course.salesCount
    }, 0)

    // Get average rating
    const averageRatingResult = await prisma.course.aggregate({
      where: {
        authorId: id
      },
      _avg: {
        rating: true
      }
    })

    const averageRating = averageRatingResult._avg.rating || 0

    // Calculate growth (simplified - you might want to implement proper time-based calculations)
    const growth = "+15%" // This would be calculated based on historical data

    // Calculate this month's students (simplified)
    const thisMonth = Math.round(totalStudents * 0.3) // Assuming 30% of students are from this month

    // Public stats - no earnings data
    const publicStats = {
      totalStudents,
      totalCourses,
      averageRating,
      growth,
      thisMonth
    }

    return NextResponse.json(publicStats)
  } catch (error) {
    console.error("Error fetching creator public stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 