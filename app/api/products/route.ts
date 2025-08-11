import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Input validation schema
const querySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)),
  sortBy: z.enum(['createdAt', 'rating', 'sales', 'price']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate and parse query parameters
    const validationResult = querySchema.safeParse({
      search: searchParams.get('search') || '',
      type: searchParams.get('type') || '',
      category: searchParams.get('category') || '',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '12',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
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

    const { search, type, category, page, limit, sortBy, sortOrder } = validationResult.data;
    const skip = (page - 1) * limit;

    // Build where clause with proper type safety
    const where: any = {
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { creator: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    if (category) {
      where.category = { name: category };
    }

    // Build orderBy clause with validation
    const orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'sales') {
      orderBy.salesCount = sortOrder;
    } else if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Fetch products with proper error handling
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          creator: {
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
          _count: {
            select: {
              reviews: true
            }
          },
          reviews: true,
          sales: true
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);

    // Helper to validate a usable image URL
    const isValidUrl = (u?: string | null) => !!u && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));

    // Transform and filter invalid products (no title or no usable image)
    const transformedProducts = products
      .map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        type: product.type,
        thumbnail: isValidUrl(product.thumbnail) ? product.thumbnail : '/placeholder.jpg',
        images: product.images,
        status: product.status,
        rating: product.rating || 0,
        sales: product.salesCount || 0,
        creator: {
          id: product.creator.id,
          name: product.creator.name,
          avatar: product.creator.profile?.avatarUrl || null
        },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }))
      // Optionally filter out products that still have no safe thumbnail or have missing essentials
      .filter(p => !!p.title && !!p.thumbnail);

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
    console.error('Error fetching products:', error);
    
    // Return appropriate error response based on error type
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch products',
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