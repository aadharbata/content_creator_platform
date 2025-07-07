import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
// import { prisma } from '@/lib/prisma';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    // Allow both CONSUMER and CREATOR roles
    if (role !== 'CONSUMER' && role !== 'CREATOR') {
      return NextResponse.json(
        { message: "Invalid role. Must be CONSUMER or CREATOR." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email already exists." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        passwordHash: hashed,
        role: role,
      },
    });

    // Automatically create CreatorProfile if user is a CREATOR
    if (user.role === 'CREATOR') {
      await prisma.creatorProfile.create({
        data: {
          userId: user.id,
          isPaid: false,
        },
      });
    }

    // After successful user creation, automatically sign them in
    // Note: This does not work directly in a route handler post-v4.
    // The client should call the signin flow after a successful signup.
    // However, we return the user data for the client to decide the next step.
    
    return NextResponse.json(
      { 
        message: "User registered successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
} 