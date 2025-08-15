import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Helper function to determine course category from content
function determineCourseCategory(course: any): string {
  try {
    // Extract categories from course contents
    const contentCategories = course.contents
      ?.map((content: any) => content.Category?.name)
      .filter((name: string | null | undefined): name is string => Boolean(name)) || []
    
    if (contentCategories.length === 0) {
      return 'General'
    }

    // Count category occurrences
    const categoryFrequency = contentCategories.reduce((acc: Record<string, number>, category: string) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    // Find most frequent category
    const mostFrequentCategory = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number)) // Sort by frequency descending
      .map(([category]) => category)[0]

    return mostFrequentCategory || 'General'
  } catch (error) {
    console.warn('Error determining course category:', error)
    return 'General'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch both courses and products
    const [courses, products] = await Promise.all([
      prisma.course.findMany({
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
              ContentAnalytics: true,
              Category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.product.findMany({
        where: {
          creatorId: id,
          status: "PUBLISHED"
        },
        include: {
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    ])

    // Transform courses
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
      duration: course.duration,
      category: determineCourseCategory(course),
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

    // Transform products to course format
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      students: product.salesCount,
      rating: product.rating,
      imgURL: product.thumbnail,
      description: product.description,
      salesCount: product.salesCount,
      createdAt: product.createdAt,
      duration: 0, // Products don't have duration
      category: product.type,
      _count: {
        reviews: product._count.reviews
      },
      ContentAnalytics: []
    }))

    // Combine and return both courses and products
    const allCourses = [...transformedCourses, ...transformedProducts]

    return NextResponse.json(allCourses)
  } catch (error) {
    console.error("Error fetching creator courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
} 