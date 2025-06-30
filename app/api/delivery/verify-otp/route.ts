import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { formatPhoneNumber } from "@/lib/content-delivery"

export async function POST(request: NextRequest) {
  try {
    const { phone, otp, purpose } = await request.json()

    if (!phone || !otp || !purpose) {
      return NextResponse.json(
        { error: "Phone, OTP, and purpose are required" },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    
    // Find the OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
        verified: false,
        expiresAt: {
          gte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      )
    }

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP" },
        { status: 400 }
      )
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      })
      
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    })

    // Update or create user with verified phone
    await prisma.user.upsert({
      where: { phone: formattedPhone },
      update: { phoneVerified: true },
      create: {
        phone: formattedPhone,
        phoneVerified: true,
        email: `${formattedPhone}@temp.com`, // Temporary email
        name: `User ${formattedPhone.slice(-4)}`,
        passwordHash: '', // Will be set if they choose email later
        role: 'CONSUMER'
      }
    })

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      phone: formattedPhone
    })

  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    )
  }
} 