import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatPhoneNumber } from '@/lib/content-delivery';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();
    console.log("OTP verification request:", { phone, otp });

    if (!phone || !otp) {
      return NextResponse.json(
        { message: "Phone number and OTP are required." },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    console.log("Formatted phone for verification:", formattedPhone);
    
    // Find the OTP record for phone verification
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        phone: formattedPhone,
        purpose: 'PHONE_VERIFICATION',
        verified: false,
        expiresAt: {
          gte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log("OTP record found:", otpRecord ? otpRecord.id : "None");

    if (!otpRecord) {
      console.log("No valid OTP record found for phone:", formattedPhone);
      return NextResponse.json(
        { message: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      console.log("Too many attempts for OTP:", otpRecord.id);
      return NextResponse.json(
        { message: "Too many failed attempts. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Verify OTP
    console.log("Comparing OTP:", { provided: otp, stored: otpRecord.otp });
    if (otpRecord.otp !== otp) {
      console.log("OTP mismatch for record:", otpRecord.id);
      
      // Increment attempts
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });
      
      return NextResponse.json(
        { message: "Invalid OTP." },
        { status: 400 }
      );
    }

    console.log("OTP verified successfully:", otpRecord.id);

    // Mark OTP as verified
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    // Update user's phone verification status
    const user = await prisma.user.update({
      where: { phone: formattedPhone },
      data: { phoneVerified: true }
    });

    console.log("User phone verified:", user.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: "Phone verified successfully. You can now login.",
        success: true,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
} 