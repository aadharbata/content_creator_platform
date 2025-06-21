import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const courses = await prisma.course.findMany({
      where: {
        authorId: id
      },
      include: {
        _count: {
          select: {
            reviews: true
          }
        },
        contents: {
          include: {
            ContentAnalytics: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform the data to match the expected interface
    const transformedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      price: course.price,
      students: course.salesCount,
      rating: course.rating,
      imgURL: course.imgURL,
      description: course.description,
      salesCount: course.salesCount,
      createdAt: course.createdAt,
      _count: {
        reviews: course._count.reviews
      },
      ContentAnalytics: course.contents.flatMap(content => 
        content.ContentAnalytics.map(analytics => ({
          views: analytics.views,
          likes: analytics.likes
        }))
      )
    }))

    return NextResponse.json(transformedCourses)
  } catch (error) {
    console.error("Error fetching creator courses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 