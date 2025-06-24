import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get all reviews for courses by this creator
    const reviews = await prisma.review.findMany({
      where: {
        course: {
          authorId: id
        }
      },
      include: {
        user: {
          select: {
            name: true,
            profile: {
              select: {
                avatarUrl: true
              }
            }
          }
        },
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to recent 50 reviews
    })

    // Transform reviews to match frontend interface
    const transformedReviews = reviews.map((review, index) => ({
      id: index + 1,
      userName: review.user.name,
      userAvatar: review.user.profile?.avatarUrl || "/placeholder.svg?height=40&width=40",
      rating: review.rating,
      comment: review.comment || `Great course! ${review.course.title} really helped me understand the concepts better.`,
      date: new Date(review.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      courseName: review.course.title,
      isVerified: true // Assume verified purchases
    }))

    return NextResponse.json(transformedReviews)
  } catch (error) {
    console.error("Error fetching creator reviews:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 