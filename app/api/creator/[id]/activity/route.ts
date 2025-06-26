import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get recent reviews on creator's courses
    const recentReviews = await prisma.review.findMany({
      where: {
        course: {
          authorId: id
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5
    })

    // Get recent course creations
    const recentCourses = await prisma.course.findMany({
      where: {
        authorId: id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 3,
      select: {
        id: true,
        title: true,
        createdAt: true,
        price: true
      }
    })

    // Get recent content uploads
    const recentContent = await prisma.content.findMany({
      where: {
        authorId: id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 3,
      select: {
        id: true,
        title: true,
        createdAt: true,
        type: true
      }
    })

    // Combine and format activities
    const activities: Array<{
      id: string
      type: string
      message: string
      time: string
      amount?: number
    }> = []

    // Add review activities
    recentReviews.forEach(review => {
      activities.push({
        id: `review-${review.id}`,
        type: "review",
        message: `${review.user.name} left a ${review.rating}-star review on "${review.course.title}"`,
        time: review.createdAt.toISOString(),
        amount: undefined
      })
    })

    // Add course creation activities
    recentCourses.forEach(course => {
      activities.push({
        id: `course-${course.id}`,
        type: "course",
        message: `New course "${course.title}" was published`,
        time: course.createdAt.toISOString(),
        amount: course.price
      })
    })

    // Add content upload activities
    recentContent.forEach(content => {
      activities.push({
        id: `content-${content.id}`,
        type: "content",
        message: `New ${content.type.toLowerCase()} "${content.title}" was uploaded`,
        time: content.createdAt.toISOString(),
        amount: undefined
      })
    })

    // Sort activities by time and take the most recent 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
      .map(activity => ({
        ...activity,
        time: new Date(activity.time).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }))

    return NextResponse.json(sortedActivities)
  } catch (error) {
    console.error("Error fetching creator activity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 