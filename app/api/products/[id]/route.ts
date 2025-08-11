import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { reviews: true },
        },
        sales: true,
      },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const transformed = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      type: product.type,
      thumbnail: product.thumbnail,
      images: product.images,
      status: product.status,
      rating: product.rating || 0,
      sales: product.salesCount || 0,
      creator: {
        id: product.creator.id,
        name: product.creator.name,
        avatar: product.creator.profile?.avatarUrl || null,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      reviewCount: product._count.reviews,
      reviews: product.reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.user,
      })),
    }

    return NextResponse.json({ success: true, product: transformed })
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
} 