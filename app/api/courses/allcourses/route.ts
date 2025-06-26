import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const sortBy = searchParams.get('sortBy') || 'newest'
    
    const offset = (page - 1) * limit

    // Build where clause (without rating filter - we'll filter after calculating actual ratings)
    const where: any = {
      AND: [
        {
          price: {
            gte: minPrice,
            lte: maxPrice
          }
        }
      ]
    }

    // Add search filter
    if (search) {
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { author: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    }

    // Add category filter
    if (category !== 'all') {
      where.AND.push({
        contents: {
          some: {
            Category: {
              name: { equals: category, mode: 'insensitive' }
            }
          }
        }
      })
    }

    // Define sort order
    let orderBy: any = { createdAt: 'desc' } // default: newest
    
    switch (sortBy) {
      case 'popular':
        orderBy = { salesCount: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'price_low':
        orderBy = { price: 'asc' }
        break
      case 'price_high':
        orderBy = { price: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Fetch courses with pagination
    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          },
          contents: {
            include: {
              Category: {
                select: {
                  name: true
                }
              }
            },
            take: 1
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.course.count({ where })
    ])

    // Transform courses data and apply rating filter after calculating actual ratings
    const transformedCourses = courses
      .map(course => {
        const avgRating = course.reviews.length > 0
          ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
          : course.rating

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          price: course.price,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: course._count.reviews,
          salesCount: course.salesCount,
          duration: course.duration,
          imgURL: course.imgURL,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          category: course.contents.length > 0 && course.contents[0].Category 
            ? course.contents[0].Category.name 
            : 'General',
          author: {
            id: course.author.id,
            name: course.author.name,
            avatarUrl: course.author.profile?.avatarUrl || '/placeholder.svg?height=32&width=32'
          },
          badge: course.salesCount > 100 ? 'Bestseller' : 
                 course.salesCount > 50 ? 'Popular' : 
                 course._count.reviews > 20 ? 'Top Rated' : null
        }
      })
      .filter(course => course.rating >= minRating) // Apply rating filter after calculating actual ratings

    // Update total count after rating filter
    const filteredCount = transformedCourses.length
    const totalPages = Math.ceil(filteredCount / limit)

    return NextResponse.json({
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        totalCount: filteredCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 