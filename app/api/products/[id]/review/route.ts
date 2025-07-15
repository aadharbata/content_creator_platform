import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Input validation schema
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: productId } = await params;

    // Validate request body
    const body = await request.json();
    const validationResult = reviewSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid review data',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { rating, comment } = validationResult.data;

    // Check if user has purchased this product
    const purchase = await prisma.productSale.findFirst({
      where: {
        productId,
        buyerId: userId,
        status: 'SUCCEEDED'
      }
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'You can only review products you have purchased' },
        { status: 403 }
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.productReview.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await prisma.productReview.update({
        where: {
          userId_productId: {
            userId,
            productId
          }
        },
        data: {
          rating,
          comment,
          createdAt: new Date()
        }
      });
    } else {
      // Create new review
      review = await prisma.productReview.create({
        data: {
          userId,
          productId,
          rating,
          comment
        }
      });
    }

    // Update product's average rating
    const allReviews = await prisma.productReview.findMany({
      where: { productId },
      select: { rating: true }
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: averageRating }
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      },
      message: existingReview ? 'Review updated successfully' : 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to submit review',
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

// Get user's review for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;

    const review = await prisma.productReview.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    return NextResponse.json({
      success: true,
      review: review ? {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      } : null
    });

  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
} 