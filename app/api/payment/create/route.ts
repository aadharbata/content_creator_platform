import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';
import { getToken } from "next-auth/jwt";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    // Extract user from NextAuth JWT
    const jwtUser = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || 'Ishan' });
    if (!jwtUser || typeof jwtUser.id !== 'string' || !jwtUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = jwtUser.id;

    const { amount, currency, creatorId } = await request.json();

    // Validate required fields
    if (!amount || !currency || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, creatorId' },
        { status: 400 }
      );
    }

    // Check if creator exists
    const creator = await prisma.creatorProfile.findUnique({ 
      where: { id: creatorId } 
    });
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency,
      receipt: `rcpt_${Date.now()}`,
    });

    // Store payment record in database
    await prisma.payment.create({
      data: {
        amount: amount,
        currency: currency,
        status: 'PENDING',
        paymentvia: 'RAZORPAY',
        paymentId: order.id,
        subscriptionId: 'temp-subscription-id', // You might want to handle this differently
        userId: userId,
      },
    });

    return NextResponse.json({ 
      success: true,
      order,
      message: 'Order created successfully' 
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
} 