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

    if (role !== 'CONSUMER') {
      return NextResponse.json(
        { message: "This route is only for consumer signup" },
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

    console.log("Registered User: ", user);
    return NextResponse.json(
      { message: "User registered successfully." },
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