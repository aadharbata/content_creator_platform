import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Fetch user's course access records with related data
    const courseAccesses = await prisma.courseAccess.findMany({
      where: {
        userId
      },
      include: {
        course: {
          include: {
            contents: {
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                url: true,
                metadata: true // This could contain file size info
              }
            },
            author: {
              select: {
                name: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    })

    // Also fetch delivery records for additional status info
    const deliveryRecords = await prisma.contentDelivery.findMany({
      where: {
        userId
      }
    })

    // Transform data to include delivery records
    const transformedCourses = courseAccesses.map(access => ({
      id: access.id,
      purchaseDate: access.purchaseDate.toISOString(),
      deliveryMethod: access.deliveryMethod,
      deliveryStatus: access.deliveryStatus,
      accessExpiryDate: access.accessExpiryDate?.toISOString(),
      course: {
        id: access.course.id,
        title: access.course.title,
        description: access.course.description,
        imgURL: access.course.imgURL,
        author: access.course.author,
        contents: access.course.contents.map(content => ({
          ...content,
          // Parse metadata to get file size if available
          size: content.metadata ? JSON.parse(content.metadata).size : undefined
        }))
      },
      contentDeliveries: deliveryRecords.filter(delivery => 
        delivery.courseId === access.courseId
      ).map(delivery => ({
        id: delivery.id,
        contentType: delivery.contentType,
        deliveryMethod: delivery.deliveryMethod,
        status: delivery.status,
        deliveredAt: delivery.deliveredAt?.toISOString() || null
      }))
    }))

    return NextResponse.json({
      success: true,
      courses: transformedCourses,
      totalCourses: transformedCourses.length
    })

  } catch (error) {
    console.error("Error fetching user courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
} 