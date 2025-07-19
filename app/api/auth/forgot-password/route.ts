import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    console.log('🔐 Password reset requested for:', email);
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: "Valid email is required." },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists with a password (not Google OAuth users)
    if (user && user.passwordHash && user.passwordHash.length > 0) {
      console.log('✅ User found for password reset:', user.id);
      
      // Generate secure reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          purpose: 'password_reset'
        },
        process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      // Store reset token in database with expiry
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await prisma.oTPVerification.create({
        data: {
          phone: user.email, // We'll reuse this field for email resets
          otp: resetToken,
          purpose: 'PASSWORD_RESET',
          expiresAt,
          verified: false
        }
      });

      // Send reset email
      const emailResult = await sendPasswordResetEmail(user.email, resetToken);
      
      if (emailResult.success) {
        console.log('✅ Password reset email sent successfully');
      } else {
        console.error('❌ Failed to send password reset email:', emailResult.message);
      }
    } else if (user && (!user.passwordHash || user.passwordHash.length === 0)) {
      console.log('⚠️ Password reset requested for Google OAuth user:', user.email);
      // Google OAuth user - they should use "Sign in with Google"
    } else {
      console.log('⚠️ Password reset requested for non-existent user:', email);
      // User doesn't exist
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json(
      { 
        message: "If an account with that email exists and uses password login, a password reset link has been sent.",
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in forgot password:', error);
    return NextResponse.json(
      { message: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
} 