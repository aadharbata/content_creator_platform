import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Input validation schema
const querySchema = z.object({
  page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(50)),
  search: z.string().optional(),
  type: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    
    // Validate and parse query parameters
    const validationResult = querySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || '',
      type: searchParams.get('type') || '',
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { page, limit, search, type } = validationResult.data;
    const skip = (page - 1) * limit;

    // Build where clause for purchased products
    const where: any = {
      sales: {
        some: {
          buyerId: userId,
          status: 'SUCCEEDED'
        }
      }
    };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { creator: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Add type filter
    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    // Fetch purchased products with related data
    const [purchasedProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
          sales: {
            where: {
              buyerId: userId,
              status: 'SUCCEEDED'
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          reviews: {
            where: {
              userId: userId
            },
            take: 1
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: {
          sales: {
            _count: 'desc'
          }
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);

    // Transform the data for frontend
    const transformedProducts = purchasedProducts.map((product: any) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      type: product.type.toLowerCase(),
      creator: {
        id: product.creator.id,
        name: product.creator.name,
        avatar: product.creator.profile?.avatarUrl || '',
        verified: true,
      },
      thumbnail: product.thumbnail || '',
      rating: product.rating,
      sales: product.salesCount,
      category: product.category?.name,
      reviewCount: product._count.reviews,
      hasReview: product.reviews.length > 0,
      userReview: product.reviews[0] ? {
        rating: product.reviews[0].rating,
        comment: product.reviews[0].comment
      } : null,
      purchaseDate: product.sales[0]?.createdAt,
      purchaseAmount: product.sales[0]?.amount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching purchased products:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch purchased products',
          message: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 