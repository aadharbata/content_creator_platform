import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get creators from User table where role is CREATOR
    const creators = await prisma.user.findMany({
      where: {
        role: 'CREATOR'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    return NextResponse.json({ 
      success: true,
      creators 
    });

  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, bankAccount, ifsc, upi } = await request.json();

    // Validate required fields
    if (!name || !email || !bankAccount || !ifsc) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, bankAccount, ifsc' },
        { status: 400 }
      );
    }

    // Create a creator record
    const creator = await prisma.creator.create({
      data: {
        name,
        email,
        bankAccount,
        ifsc,
        upi: upi || null,
      },
    });

    return NextResponse.json({ 
      success: true,
      creator,
      message: 'Creator created successfully' 
    });

  } catch (error) {
    console.error('Error creating creator:', error);
    return NextResponse.json(
      { error: 'Failed to create creator' },
      { status: 500 }
    );
  }
} 