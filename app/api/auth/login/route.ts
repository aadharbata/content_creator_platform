import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Body in login: ", body);
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    console.log("Looking for user with email:", email.toLowerCase().trim());

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    console.log("User found:", user ? "Yes" : "No");
    if (user) {
      console.log("User ID:", user.id);
      console.log("User has passwordHash:", !!user.passwordHash);
    }

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    if (!user?.passwordHash) {
      return NextResponse.json(
        { message: "Account setup incomplete. Please contact support." },
        { status: 500 }
      );
    }

    // Verify password
    console.log("Comparing password with hash...");
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match:", isMatch);
    
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Generate JWT token
    const payload = { 
      id: user.id, 
      email: user.email,
      type: "user" 
    };
    
    const jwtSecret = 'aadhar123';
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

    return NextResponse.json({ 
      token, 
      type: "user",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 200 });

  } catch (err) {
    console.error("Login error:", err);
    
    // Handle specific error types
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid request format." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
} 