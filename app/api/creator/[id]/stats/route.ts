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

    // Get total earnings (sum of all course sales)
    const coursesWithSales = await prisma.course.findMany({
      where: {
        authorId: id
      },
      select: {
        price: true,
        salesCount: true
      }
    })

    const totalEarnings = coursesWithSales.reduce((sum, course) => {
      return sum + (course.price * course.salesCount)
    }, 0)

    // Get total students (sum of all sales counts)
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

    // Calculate this month's earnings (simplified)
    const thisMonth = Math.round(totalEarnings * 0.3) // Assuming 30% of earnings are from this month

    const stats = {
      totalEarnings,
      totalStudents,
      totalCourses,
      averageRating,
      growth,
      thisMonth
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching creator stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 