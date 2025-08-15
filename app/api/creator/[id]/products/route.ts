import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch products for the specific creator
    const products = await prisma.product.findMany({
      where: {
        creatorId: id,
        status: 'PUBLISHED'
      },
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      type: product.type,
      thumbnail: product.thumbnail || '/placeholder.jpg',
      images: product.images,
      status: product.status,
      rating: product.rating || 0,
      salesCount: product.salesCount || 0,
      creator: {
        id: product.creator.id,
        name: product.creator.name,
        avatar: product.creator.profile?.avatarUrl || null
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      _count: product._count
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts
    });

  } catch (error) {
    console.error('Error fetching creator products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 