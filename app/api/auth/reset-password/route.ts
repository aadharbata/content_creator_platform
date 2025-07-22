import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    
    console.log('🔐 Password reset attempt with token');
    
    // Validate inputs
    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and new password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret');
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (error) {
      console.error('❌ Invalid or expired token:', error);
      return NextResponse.json(
        { message: "Invalid or expired reset token. Please request a new password reset." },
        { status: 400 }
      );
    }

    // Check if token exists in database and is not used
    const tokenRecord = await prisma.oTPVerification.findFirst({
      where: {
        otp: token,
        purpose: 'PASSWORD_RESET',
        verified: false,
        expiresAt: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!tokenRecord) {
      console.error('❌ Token not found in database or already used');
      return NextResponse.json(
        { message: "Invalid or expired reset token. Please request a new password reset." },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        email: decoded.email 
      }
    });

    if (!user) {
      console.error('❌ User not found for token');
      return NextResponse.json(
        { message: "Invalid reset token. User not found." },
        { status: 400 }
      );
    }

    // Check if user has a password (not Google OAuth user)
    if (!user.passwordHash || user.passwordHash.length === 0) {
      console.error('❌ Password reset attempted for Google OAuth user');
      return NextResponse.json(
        { message: "This account uses Google sign-in. Please use 'Sign in with Google' instead." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ New password hashed for user:', user.id);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword }
    });

    // Mark token as used
    await prisma.oTPVerification.update({
      where: { id: tokenRecord.id },
      data: { verified: true }
    });

    console.log('✅ Password reset successful for user:', user.email);

    return NextResponse.json(
      { 
        message: "Password reset successful! You can now log in with your new password.",
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in password reset:', error);
    return NextResponse.json(
      { message: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
} 