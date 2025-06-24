import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';
import axios from 'axios';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const { paymentId, creatorId } = await request.json();

    // Validate required fields
    if (!paymentId || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, creatorId' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Convert amount to INR (assuming payment is in INR)
    const convertedINR = Number(payment.amount) / 100; // Convert from paise to rupees

    // Calculate commission (20%)
    const commission = 0.2 * convertedINR;
    const payoutAmount = convertedINR - commission;

    // Get creator details - using User model instead of Creator for now
    const creator = await prisma.user.findUnique({ 
      where: { id: creatorId } 
    });
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Update payment record with converted amount
    await prisma.payment.updateMany({
      where: { paymentId: payment.order_id },
      data: { 
        convertedAmount: convertedINR,
        status: 'SUCCEEDED'
      },
    });

    // Create payout to creator
    const payout = await axios.post('https://api.razorpay.com/v1/payouts', {
      account_number: process.env.RAZORPAY_PAYOUT_ACCOUNT,
      fund_account: {
        account_type: 'bank_account',
        bank_account: {
          name: creator.name,
          ifsc: 'SBIN0000001', // Default IFSC - you might want to store this in user profile
          account_number: '1234567890', // Default account - you might want to store this in user profile
        },
      },
      amount: Math.round(payoutAmount * 100), // Convert to paise
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
    }, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID!,
        password: process.env.RAZORPAY_SECRET!,
      },
    });

    return NextResponse.json({ 
      success: true, 
      payout: payout.data,
      message: 'Payment confirmed and payout initiated',
      details: {
        originalAmount: convertedINR,
        commission,
        payoutAmount,
        creatorName: creator.name
      }
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
} 